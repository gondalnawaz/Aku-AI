import { authClient } from '@/api/authClient';

const meta = /** @type {any} */ (import.meta);
const BASE_URL = meta.env?.VITE_API_BASE_URL || "http://localhost:8000";
/**
 * @param {string} method
 * @param {string} path
 * @param {any} [body]
 */
async function request(method, path, body) {
    const token = authClient.auth.getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok)
        throw new Error(data.detail || "API error");
    return data;
}
export const api = {
    /** @param {any} job */
    createJob: (job) => request("POST", "/jobs", job),
    /** @param {string} email */
    listJobs: (email) => request("GET", `/jobs?email=${encodeURIComponent(email)}`),
    /** @param {string} id */
    getJob: (id) => request("GET", `/jobs/${id}`),
    /**
     * @param {string} id
     * @param {any} updates
     */
    updateJob: (id, updates) => request("PATCH", `/jobs/${id}`, updates),
    /** @param {{ plan: string, email: string, jobId?: string | null, currency?: string }} params */
    createCheckout: ({ plan, email, jobId, currency }) => request("POST", "/checkout", { plan, email, job_id: jobId, currency }),
    detectLocale: () => request("GET", "/locale/auto"),
    /** @param {any} review */
    submitReview: (review) => request("POST", "/reviews", review),
    /** @param {string | undefined} email */
    async getUserPoints(email) {
        const query = email ? `?email=${encodeURIComponent(email)}` : "";
        return request("GET", `/users/points${query}`);
    },
};

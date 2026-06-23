// @ts-nocheck
const meta = /** @type {any} */ (import.meta);
const BASE_URL = (meta.env?.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const TOKEN_KEY = 'auth_token';
const REQUEST_TIMEOUT_MS = 30000;
async function authFetch(method, path, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token)
        headers['Authorization'] = `Bearer ${token}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
    let res;
    try {
        res = await fetch(url, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });
    }
    catch (fetchError) {
        if (fetchError?.name === 'AbortError') {
            throw new Error(`Request timeout: ${method} ${path} took more than ${REQUEST_TIMEOUT_MS / 1000}s`);
        }
        throw new Error(`Cannot reach API at ${BASE_URL}. Please ensure backend is running.`);
    }
    finally {
        clearTimeout(timeoutId);
    }
    if (res.status === 404 && path.startsWith('/')) {
        const fallbackUrl = `${BASE_URL}/api${path}`;
        res = await fetch(fallbackUrl, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    }
    const rawText = await res.text();
    let data = {};
    if (rawText) {
        try {
            data = JSON.parse(rawText);
        }
        catch {
            data = { message: rawText };
        }
    }
    if (!res.ok) {
        const err = /** @type {any} */ (new Error(data.detail || data.message || 'Request failed'));
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}
const auth = {
    getToken: () => localStorage.getItem(TOKEN_KEY),
    setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
    clearToken: () => localStorage.removeItem(TOKEN_KEY),
    async me() {
        const token = this.getToken();
        if (!token) {
            const err = /** @type {any} */ (new Error('Not authenticated'));
            err.status = 401;
            throw err;
        }
        return authFetch('GET', '/auth/me', undefined, token);
    },
    async loginViaEmailPassword(email, password) {
        const data = await authFetch('POST', '/auth/login', { email, password });
        if (data.access_token)
            this.setToken(data.access_token);
        return data;
    },
    async register({ email, password }) {
        return authFetch('POST', '/auth/register', { email, password });
    },
    async verifyOtp({ email, otpCode }) {
        const data = await authFetch('POST', '/auth/verify-otp', {
            email,
            otp_code: otpCode,
        });
        if (data.access_token)
            this.setToken(data.access_token);
        return data;
    },
    async resendOtp(email) {
        return authFetch('POST', '/auth/resend-otp', { email });
    },
    async resetPasswordRequest(email) {
        return authFetch('POST', '/auth/forgot-password', { email });
    },
    async resetPassword({ resetToken, newPassword }) {
        return authFetch('POST', '/auth/reset-password', {
            reset_token: resetToken,
            new_password: newPassword,
        });
    },
    loginWithProvider(provider, redirectTo = '/') {
        const callbackUrl = `${window.location.origin}${redirectTo}`;
        window.location.href = `${BASE_URL}/auth/oauth/${provider}?redirect_to=${encodeURIComponent(callbackUrl)}`;
    },
    logout(redirectHref = null) {
        this.clearToken();
        window.location.href = redirectHref || '/login';
    },
    redirectToLogin() {
        window.location.href = '/login';
    },
};
export const authClient = { auth };

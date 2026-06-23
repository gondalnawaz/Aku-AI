import { useState } from "react";
import { api } from "../lib/apiClient";
import { t } from "../lib/i18n";
import { Star, Send } from "lucide-react";

/** @param {{ lang?: string, onDismiss?: () => void, user?: any }} props */
export default function ReviewPromptCard({ lang = "en", onDismiss, user }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetForm = () => {
    setRating(5);
    setComment("");
    setIsSubmitting(false);
  };

  const handleSubmit = async (/** @type {any} */ e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      await api.submitReview({
        rating,
        comment: comment.trim(),
        user_id: user?.id ?? null,
        user_name: user?.name ?? user?.full_name ?? null,
        user_email: user?.email ?? null,
        job_id: null,
        page: "dashboard",
        language: lang,
      });
      setIsSuccess(true);
      setTimeout(() => onDismiss?.(), 1500);
    } catch {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="glass rounded-xl p-6 hover:border-gold/30 transition-all group">
        <p className="text-green-700 font-semibold">{t("review_thanks", lang)}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold">{t("review_prompt_title", lang)}</h4>
          <p className="text-gray-600 mt-1">{t("review_prompt_text", lang)}</p>
        </div>
      </div>
    <div className="glass rounded-xl p-6 hover:border-gold/30 transition-all group">

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-start">
          <label className="block text-sm font-medium m-2">
            {t("review_rating_label", lang)}:
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="transition hover:scale-110"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("review_comment_label", lang)}:
          </label>
          <textarea
            className="w-full rounded-lg text-gray-800 border border-gray-300 px-3 py-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-black"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("review_comment_placeholder", lang)}
            maxLength={1000}
            required
          />
          <p className="text-xs text-gray-400 mt-1">{comment.length}/1000</p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="inline-flex items-center border border-gray-600 gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm"
            onClick={() => {
              resetForm();
              onDismiss?.();
            }}
          >
            {t("review_not_now", lang)}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !comment.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 text-sm hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? t("review_submitting", lang) : t("review_submit", lang)}
          </button>
        </div>
      </form>
    </div>
    </div>
  );
}
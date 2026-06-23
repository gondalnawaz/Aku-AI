import React from "react";
import { t } from "@/lib/i18n";

const reviews = [
  {
    name: "Michael R.",
    text: "The analysis was fast and surprisingly accurate. It helped me understand my mistakes immediately.",
  },
  {
    name: "Sofia L.",
    text: "Very easy to use. Uploading and getting results took just a few minutes.",
  },
  {
    name: "Daniel K.",
    text: "Great service quality. The insights are practical and improved my match decisions.",
  },
];

export default function CustomerReviewsSection({ lang = "en" }) {
  const title = t("customer_reviews_title", lang);

  return (
    <section className="w-full py-16">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-gold text-sm font-mono-data uppercase tracking-widest mb-3 text-center">{t('home_review', lang)}</p>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">{title}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((item, idx) => (
            <article
              key={idx}
              className="flex flex-col glass rounded-xl p-6 hover:border-gold/30 transition-all group"
            >
              <p className="text-white/50 text-sm leading-relaxed">“{item.text}”</p>
              <p className="text-sm text-right font-semibold text-gold mt-auto">{item.name}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
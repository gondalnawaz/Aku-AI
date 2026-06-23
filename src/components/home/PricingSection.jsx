import { Link } from "react-router-dom";
import { Check, Zap, Clock, Calendar, Star } from "lucide-react";
import { useLang, convertPrice } from "@/lib/useLang";
import { t } from "@/lib/i18n";
import { useState } from "react";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/lib/AuthContext"; // adjust path if your project uses a different auth hook path

export default function PricingSection() {
  const { lang, currency } = useLang();
  const { user, isAuthenticated } = useAuth();

  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState(/** @type {string | null} */ (null));

  const servicePlans = [
    {
      key: "trial",
      labelKey: "plan_trial",
      subtitleKey: "plan_trial_subtitle",
      gbpPrice: 0,
      points: 0,
      icon: Calendar,
      color: "text-white/60",
      border: "border-white/20",
      highlight: false,
      features: [
        "trial_feature_free",
        "trial_feature_video_limit",
        "trial_feature_basic_processing",
      ],
    },
    {
      key: "standard",
      labelKey: "plan_standard",
      subtitleKey: "plan_standard_subtitle",
      gbpPrice: 12,
      points: 3,
      icon: Clock,
      color: "text-electric-blue",
      border: "border-blue-500/40",
      highlight: true,
      features: [
        "standard_feature_points",
        "standard_feature_normal_priority",
        "standard_feature_export",
      ],
    },
    {
      key: "quick",
      labelKey: "plan_quick",
      subtitleKey: "plan_quick_subtitle",
      gbpPrice: 16,
      points: 4,
      icon: Zap,
      color: "text-gold",
      border: "border-gold/40",
      highlight: false,
      features: [
        "quick_feature_points",
        "quick_feature_high_priority",
        "quick_feature_faster_processing",
      ],
    },
  ];

  const creditPlans = [
    {
      key: "single_point",
      labelKey: "credits_single_point",
      subtitleKey: "credits_single_point_subtitle",
      gbpPrice: 4,
      points: 1,
      icon: Star,
      color: "text-gold",
      border: "border-gold/30",
      highlight: false,
      features: ["credit_feature_one_point", "credit_feature_payg"],
    },
    {
      key: "monthly",
      labelKey: "credits_monthly_40",
      subtitleKey: "credits_monthly_40_subtitle",
      gbpPrice: 125,
      points: 40,
      icon: Clock,
      color: "text-electric-blue",
      border: "border-blue-500/40",
      highlight: true,
      features: ["credit_feature_40_points", "credit_feature_monthly_billing"],
    },
    {
      key: "annual",
      labelKey: "credits_annual_480",
      subtitleKey: "credits_annual_40_subtitle",
      gbpPrice: 1250,
      points: 480,
      icon: Calendar,
      color: "text-white/60",
      border: "border-white/20",
      highlight: false,
      badgeKey: "pricing_best_value",
      features: ["credit_feature_480_points", "credit_feature_annual_billing"],
    },
  ];

  /** @param {string} planKey */
  const handlePurchase = async (planKey) => {
    try {
      const email = user?.email || "";

      if (!isAuthenticated || !email) {
        alert("Please sign in before purchasing.");
        return;
      }

      setCheckoutLoadingPlan(planKey);

      const currencyCode = currency?.code || "GBP";
      const checkout = await api.createCheckout({
        plan: planKey,
        email,
        jobId: null,
        currency: currencyCode,
      });

      if (checkout?.url) {
        window.location.href = checkout.url;
      }
    } catch (e) {
      console.error("createCheckout failed:", e);
      alert("Unable to start checkout.");
    } finally {
      setCheckoutLoadingPlan(null);
    }
  };

  /** @param {any} item @param {boolean} [isService=false] */
  const renderCard = (item, isService = false) => {
    const {
      key,
      labelKey,
      subtitleKey,
      gbpPrice,
      points,
      icon: Icon,
      color,
      border,
      highlight,
      features,
      badgeKey,
    } = item;

    return (
      <div
        key={key}
        className={`relative glass rounded-2xl p-6 flex flex-col ${border} ${
          highlight ? "ring-2 ring-blue-500/50 scale-105" : ""
        } hover:border-gold/40 transition-all`}
      >
        {highlight && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-electric-blue text-white text-xs font-bold rounded-full">
            {t("pricing_popular", lang)}
          </div>
        )}

        {badgeKey && (
          <div className="absolute -top-3 right-4 px-2 py-1 bg-gold text-navy text-xs font-bold rounded-full">
            {t(badgeKey, lang)}
          </div>
        )}

        <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>

        <h3 className="text-white font-bold text-lg mb-1">{t(labelKey, lang)}</h3>
        <p className="text-white/40 text-xs mb-1 font-mono-data">{t(subtitleKey, lang)}</p>
        {isService && (
          <div className="mb-6">
            <span className="text-3xl font-black text-white font-mono-data">
              {points} {t("pricing_points", lang)}{points > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {!isService && (
          <div className="mb-6">
            <span className="text-3xl font-black text-white font-mono-data">
              {gbpPrice === 0 ? t("free", lang) : `${currency.symbol}${convertPrice(gbpPrice, currency)}`}
            </span>
            <div className="text-xs text-gold/60 mt-1 font-mono-data">
              {points} {t("pricing_points", lang)}{points > 1 ? 's' : ''}
            </div>
          </div>
        )}

        <ul className="space-y-2 mb-6 flex-1">
          {features.map((/** @type {string} */ featureKey) => (
            <li key={featureKey} className="flex items-center gap-2 text-sm text-white/60">
              <Check className="w-3.5 h-3.5 text-gold flex-shrink-0" />
              {t(featureKey, lang)}
            </li>
          ))}
        </ul>

        {isService && (
        <Link
          to={`/upload?plan=${key}`}
          className={`block text-center py-2.5 rounded-lg font-semibold text-sm transition-all ${
            highlight
              ? "bg-electric-blue text-white hover:bg-blue-600"
              : "bg-gold/10 text-gold border border-gold/30 hover:bg-gold hover:text-navy"
          }`}
        >
          {t("select_service", lang)}
        </Link>
        )}
        {!isService && (
          <button
            type="button"
            onClick={() => handlePurchase(key)}
            disabled={checkoutLoadingPlan === key}
            className={`block text-center py-2.5 rounded-lg font-semibold text-sm transition-all ${
              highlight
                ? "bg-electric-blue text-white hover:bg-blue-600"
                : "bg-gold/10 text-gold border border-gold/30 hover:bg-gold hover:text-navy"
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {checkoutLoadingPlan === key ? "Loading..." : t("purchase", lang)}
          </button>
        )}
      </div>
    );
  };

  return (
    <section className="py-14 px-6 bg-charcoal/20">
      <div className="max-w-7xl mx-auto space-y-14">
        <div>
          <h2 className="text-3xl font-black text-white mb-6">{t("pricing_service_title", lang)}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {servicePlans.map((item) => renderCard(item, true))}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-black text-white mb-6">{t("pricing_credit_title", lang)}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPlans.map((item) => renderCard(item, false))}
          </div>
        </div>
      </div>
    </section>
  );
}

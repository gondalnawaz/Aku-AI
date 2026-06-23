import PricingSection from '@/components/home/PricingSection';
import FaqSection from '@/components/home/FaqSection';
import { useLang } from '@/lib/useLang';
import { t } from '@/lib/i18n';
export default function Pricing() {
    const { lang } = useLang();
    return (<div className="min-h-screen bg-background" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="py-10 text-center px-6">
        <p className="text-gold text-sm font-mono-data uppercase tracking-widest mb-3">{t('pricing_badge', lang)}</p>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4">{t('pricing_title', lang)}</h1>
        <p className="text-white/50 text-lg max-w-xl mx-auto">{t('pricing_sub', lang)}</p>
      </div>
      <PricingSection />
      <FaqSection />
    </div>);
}

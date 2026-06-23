import { Link } from 'react-router-dom';
import { Upload, Play, ChevronRight, Zap, Shield, Target, Brain, BarChart3, CheckCircle, ArrowRight } from 'lucide-react';
import { useLang } from '@/lib/useLang';
import { t } from '@/lib/i18n';
import PricingSection from '@/components/home/PricingSection';
import FaqSection from '@/components/home/FaqSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import HeroDashboardDemo from '@/components/home/HeroDashboardDemo';
import CustomerReviewsSection from '@/components/CustomerReviewsSection';

export default function Home() {
    const { lang, currency } = useLang();
    const features = [
        { icon: Brain, titleKey: 'home_feature_1_title', descKey: 'home_feature_1_desc' },
        { icon: Target, titleKey: 'home_feature_2_title', descKey: 'home_feature_2_desc' },
        { icon: Zap, titleKey: 'home_feature_3_title', descKey: 'home_feature_3_desc' },
        { icon: Shield, titleKey: 'home_feature_4_title', descKey: 'home_feature_4_desc' },
        { icon: BarChart3, titleKey: 'home_feature_5_title', descKey: 'home_feature_5_desc' },
        { icon: CheckCircle, titleKey: 'home_feature_6_title', descKey: 'home_feature_6_desc' },
    ];
    const problems = [
        { stat: '4+ hrs', labelKey: 'home_problem_1_label' },
        { stat: '~12%', labelKey: 'home_problem_2_label' },
        { stat: '0 min', labelKey: 'home_problem_3_label' },
        { stat: '>98%', labelKey: 'home_problem_4_label' },
    ];
    return (<div className="bg-background" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-charcoal to-background"/>
          
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(rgba(212,175,55,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
        }}/>
          
          {[...Array(8)].map((_, i) => (<div key={i} className="absolute animate-float" style={{
                left: `${10 + i * 12}%`,
                bottom: `${5 + (i % 3) * 8}%`,
                animationDelay: `${i * 0.8}s`,
                opacity: 0.15,
            }}>
              <div style={{
                width: 0, height: 0,
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderBottom: `20px solid #D4AF37`,
            }}/>
            </div>))}
          
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold/5 rounded-full blur-3xl"/>
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-electric-blue/5 rounded-full blur-3xl"/>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/10 border border-gold/30 rounded-full text-gold text-xs font-mono-data mb-6">
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse-gold"/>
              {t('home_ai_badge', lang)}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-6">
              {t('hero_title', lang)}
            </h1>
            <p className="text-lg text-white/60 leading-relaxed mb-10 max-w-xl">
              {t('hero_sub', lang)}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/upload" className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-navy font-bold rounded-lg hover:bg-gold/90 transition-all hover:scale-105 shadow-lg shadow-gold/20">
                <Upload className="w-4 h-4"/>
                {t('hero_cta_upload', lang)}
              </Link>
              <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3 glass text-white font-semibold rounded-lg hover:border-gold/40 transition-all">
                {t('hero_cta_pricing', lang)}
                <ChevronRight className="w-4 h-4"/>
              </Link>
              <a href="#how" className="inline-flex items-center gap-2 px-6 py-3 text-white/60 hover:text-white font-medium transition-colors">
                <Play className="w-4 h-4 text-electric-blue"/>
                {t('hero_cta_demo', lang)}
              </a>
            </div>
          </div>

          
          <HeroDashboardDemo />
        </div>
      </section>

      
      <section className="bg-charcoal/50 border-y border-gold/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-white/40 text-sm uppercase tracking-widest mb-8 font-mono-data">
            {t('problem_title', lang)}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {problems.map(({ stat, labelKey }) => (<div key={stat} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-gold font-mono-data mb-2">{stat}</div>
                <div className="text-xs text-white/40 leading-tight">{t(labelKey, lang)}</div>
              </div>))}
          </div>
          <p className="text-center text-white/50 text-base mt-8 max-w-2xl mx-auto">{t('problem_desc', lang)}</p>
        </div>
      </section>

      
      <div id="how">
        <HowItWorksSection />
      </div>

      <CustomerReviewsSection lang={lang} />
      
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold text-sm font-mono-data uppercase tracking-widest mb-3">{t('home_capabilities', lang)}</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">{t('features_title', lang)}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, titleKey, descKey }) => (<div key={titleKey} className="glass rounded-xl p-6 hover:border-gold/30 transition-all group">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <Icon className="w-5 h-5 text-gold"/>
                </div>
                <h3 className="text-white font-semibold mb-2">{t(titleKey, lang)}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{t(descKey, lang)}</p>
              </div>))}
          </div>
        </div>
      </section>

      
      <PricingSection />

      
      <FaqSection />

      
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
            {t('home_final_title', lang)}
          </h2>
          <p className="text-white/50 text-lg mb-10">{t('home_final_sub', lang)}</p>
          <Link to="/upload" className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-navy font-black text-lg rounded-xl hover:bg-gold/90 transition-all hover:scale-105 shadow-xl shadow-gold/20">
            {t('hero_cta_upload', lang)}
            <ArrowRight className="w-5 h-5"/>
          </Link>
        </div>
      </section>
    </div>);
}

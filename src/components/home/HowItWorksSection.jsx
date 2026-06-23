import { Smartphone, Upload, Brain, Download } from 'lucide-react';
import { useLang } from '@/lib/useLang';
import { t } from '@/lib/i18n';
const steps = [
    {
        num: '01',
        icon: Smartphone,
        titleKey: 'step1_title',
        descKey: 'step1_desc',
        bullets: ['how_bullet_1_1', 'how_bullet_1_2', 'how_bullet_1_3', 'how_bullet_1_4'],
    },
    {
        num: '02',
        icon: Upload,
        titleKey: 'step2_title',
        descKey: 'step2_desc',
        bullets: ['how_bullet_2_1', 'how_bullet_2_2', 'how_bullet_2_3', 'how_bullet_2_4'],
    },
    {
        num: '03',
        icon: Brain,
        titleKey: 'step3_title',
        descKey: 'step3_desc',
        bullets: ['how_bullet_3_1', 'how_bullet_3_2', 'how_bullet_3_3', 'how_bullet_3_4'],
    },
    {
        num: '04',
        icon: Download,
        titleKey: 'step4_title',
        descKey: 'step4_desc',
        bullets: ['how_bullet_4_1', 'how_bullet_4_2', 'how_bullet_4_3', 'how_bullet_4_4'],
    },
];
export default function HowItWorksSection() {
    const { lang } = useLang();
    return (<section className="py-24 px-6 bg-charcoal/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-gold text-sm font-mono-data uppercase tracking-widest mb-3">{t('how_badge', lang)}</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">{t('how_title', lang)}</h2>
        </div>

        
        <div className="relative">
          <div className="hidden lg:block absolute top-16 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"/>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map(({ num, icon: Icon, titleKey, descKey, bullets }) => (<div key={num} className="relative text-center group">
                
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-navy border-2 border-gold/40 text-gold font-black font-mono-data text-sm mb-6 group-hover:border-gold group-hover:bg-gold/10 transition-all relative z-10">
                  {num}
                </div>
                <Icon className="w-6 h-6 text-gold/60 mx-auto mb-3"/>
                <h3 className="text-white font-bold mb-2 text-lg">{t(titleKey, lang)}</h3>
                <p className="text-white/50 text-sm mb-4 leading-relaxed">{t(descKey, lang)}</p>
                <ul className="space-y-1">
                  {bullets.map((bulletKey) => (<li key={bulletKey} className="flex items-center justify-center gap-1.5 text-xs text-white/40">
                      <span className="w-1 h-1 bg-gold/50 rounded-full"/>
                      {t(bulletKey, lang)}
                    </li>))}
                </ul>
              </div>))}
          </div>
        </div>
      </div>
    </section>);
}

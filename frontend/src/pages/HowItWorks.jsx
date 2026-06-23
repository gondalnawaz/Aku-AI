import { Link } from 'react-router-dom';
import { Smartphone, Upload, Brain, Download, CheckCircle, ArrowRight } from 'lucide-react';
import { useLang } from '@/lib/useLang';
import { t } from '@/lib/i18n';
const steps = [
    {
        num: '01',
        icon: Smartphone,
        titleKey: 'step1_title',
        descKey: 'step1_desc',
        methods: [
            { label: 'Mobile Video', desc: 'Record your match on any smartphone.' },
            { label: 'Camera / Webcam', desc: 'High-quality recording for tournament-grade accuracy.' },
            { label: 'Screenshots', desc: 'Take position screenshots at each move — works great for online matches.' },
            { label: 'Manual Notation', desc: 'Text-based notation in any format — our AI interprets it.' },
        ],
    },
    {
        num: '02',
        icon: Upload,
        titleKey: 'step2_title',
        descKey: 'step2_desc',
        methods: [
            { label: 'Video Files', desc: 'MP4, MOV, AVI, MKV.' },
            { label: 'Image Sets', desc: 'JPG, PNG, HEIC — upload all position screenshots at once.' },
            { label: 'Text Notation', desc: 'TXT files in standard or freeform notation.' },
            { label: 'Upload', desc: 'Upload matches to our queue system.' },
        ],
    },
    {
        num: '03',
        icon: Brain,
        titleKey: 'step3_title',
        descKey: 'step3_desc',
        methods: [
            { label: 'Board Recognition', desc: 'Neural networks detect the full board state in every frame.' },
            { label: 'Dice Detection', desc: 'Computer vision reads die values with >99% accuracy.' },
            { label: 'Checker Tracking', desc: 'Tracks every checker movement and validates legal moves.' },
            { label: 'Cube Analysis', desc: 'Detects doubling cube actions, takes, passes, and beavers.' },
        ],
    },
    {
        num: '04',
        icon: Download,
        titleKey: 'step4_title',
        descKey: 'step4_desc',
        methods: [
            { label: 'XG .mat File', desc: 'Direct import into Extreme Gammon — no re-entry.' },
            { label: 'Match Notation', desc: 'Human-readable move-by-move notation.' },
            { label: 'JSON Export', desc: 'Structured data for developers and custom tools.' },
            { label: 'Equity Report', desc: 'Per-move equity analysis ready for study.' },
        ],
    },
];
export default function HowItWorks() {
    const { lang } = useLang();
    return (<div className="min-h-screen bg-background py-20 px-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-gold text-sm font-mono-data uppercase tracking-widest mb-3">{t('how_badge', lang)}</p>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">{t('how_title', lang)}</h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            {t('how_subtitle', lang)}
          </p>
        </div>

        <div className="space-y-16">
          {steps.map(({ num, icon: Icon, titleKey, descKey, methods }, idx) => (<div key={num} className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-start ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
              
              <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-gold/40 text-5xl font-black font-mono-data">{num}</span>
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gold"/>
                  </div>
                </div>
                <h2 className="text-2xl font-black text-white mb-3">{t(titleKey, lang)}</h2>
                <p className="text-white/50 leading-relaxed mb-6">{t(descKey, lang)}</p>
                {idx === steps.length - 1 && (<Link to="/upload" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-navy font-bold rounded-lg hover:bg-gold/90 transition-colors">
                    {t('hero_cta_upload', lang)}
                    <ArrowRight className="w-4 h-4"/>
                  </Link>)}
              </div>
              
              <div className={`space-y-3 ${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
                {methods.map(({ label, desc }) => (<div key={label} className="glass rounded-xl p-4 flex gap-3 hover:border-gold/30 transition-all">
                    <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5"/>
                    <div>
                      <p className="text-white font-semibold text-sm">{label}</p>
                      <p className="text-white/50 text-sm">{desc}</p>
                    </div>
                  </div>))}
              </div>
            </div>))}
        </div>
      </div>
    </div>);
}

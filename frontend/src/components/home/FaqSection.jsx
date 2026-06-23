import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLang } from '@/lib/useLang';
import { t } from '@/lib/i18n';
const faqs = [
    {
        qKey: 'faq_q1',
        aKey: 'faq_a1',
    },
    {
        qKey: 'faq_q2',
        aKey: 'faq_a2',
    },
    {
        qKey: 'faq_q3',
        aKey: 'faq_a3',
    },
    {
        qKey: 'faq_q4',
        aKey: 'faq_a4',
    },
    {
        qKey: 'faq_q5',
        aKey: 'faq_a5',
    },
    {
        qKey: 'faq_q6',
        aKey: 'faq_a6',
    },
];
export default function FaqSection() {
    const [open, setOpen] = useState((null));
    const { lang } = useLang();
    return (<section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-gold text-sm font-mono-data uppercase tracking-widest mb-3">{t('faq_badge', lang)}</p>
          <h2 className="text-3xl md:text-4xl font-black text-white">{t('faq_title', lang)}</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (<div key={i} className={`glass rounded-xl overflow-hidden transition-all ${open === i ? 'border-gold/30' : ''}`}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left group">
                <span className={`font-medium transition-colors ${open === i ? 'text-gold' : 'text-white group-hover:text-gold'}`}>
                  {t(faq.qKey, lang)}
                </span>
                <ChevronDown className={`w-4 h-4 text-gold/60 flex-shrink-0 ml-4 transition-transform ${open === i ? 'rotate-180' : ''}`}/>
              </button>
              {open === i && (<div className="px-5 pb-5 text-white/60 text-sm leading-relaxed border-t border-white/5 pt-4">
                  {t(faq.aKey, lang)}
                </div>)}
            </div>))}
        </div>
      </div>
    </section>);
}

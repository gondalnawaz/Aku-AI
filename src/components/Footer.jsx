import { Link } from 'react-router-dom';
import { useLang } from '@/lib/useLang';
import { t } from '@/lib/i18n';
export default function Footer() {
    const { lang } = useLang();
    return (<footer className="bg-navy border-t border-gold/20">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 relative">
                <div className="absolute inset-0 bg-gold/20 rotate-45 rounded-sm"/>
                <div className="absolute inset-1.5 bg-gold rotate-45 rounded-sm"/>
              </div>
              <span className="text-lg font-bold text-gold">BG Analysis</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              {t('footer_desc', lang)}
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t('footer_platform', lang)}</h4>
            <ul className="space-y-2">
              {[
            ['/how-it-works', t('nav_how', lang)],
            ['/features', t('nav_features', lang)],
            ['/pricing', t('nav_pricing', lang)],
            ['/upload', t('nav_upload', lang)],
        ].map(([to, label]) => (<li key={to}>
                  <Link to={to} className="text-white/50 hover:text-gold text-sm transition-colors">{label}</Link>
                </li>))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t('footer_account', lang)}</h4>
            <ul className="space-y-2">
              {[
            ['/login', t('nav_login', lang)],
            ['/register', t('nav_register', lang)],
            ['/dashboard', t('nav_dashboard', lang)],
        ].map(([to, label]) => (<li key={to}>
                  <Link to={to} className="text-white/50 hover:text-gold text-sm transition-colors">{label}</Link>
                </li>))}
            </ul>
          </div>
        </div>

        
        <div className="border-t border-gold/20 pt-12 mb-8">
          <p className="text-white/30 text-sm max-w-3xl leading-relaxed font-mono-data">
            "{t('footer_manifesto', lang)}"
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30">
          <p>{t('footer_rights', lang)}</p>
          <p className="font-mono-data">
            {t('footer_powered', lang)}
          </p>
        </div>
      </div>
    </footer>);
}

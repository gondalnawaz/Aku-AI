import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Globe, ChevronDown, LogOut, UserCircle2 } from 'lucide-react';
import { useLang } from '@/lib/useLang';
import { useAuth } from '@/lib/AuthContext';
import { t, languages, currencies } from '@/lib/i18n';
export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const [curOpen, setCurOpen] = useState(false);
    const { lang, setLang, currency, setCurrency } = useLang();
    const { user, isAuthenticated, isLoadingAuth, logout, userPoints } = useAuth();
    const location = useLocation();
    const navLinks = [
        { key: 'nav_home', to: '/' },
        { key: 'nav_how', to: '/how-it-works' },
        { key: 'nav_features', to: '/features' },
        { key: 'nav_pricing', to: '/pricing' },
        { key: 'nav_upload', to: '/upload' },
    ];
    const isActive = (to) => location.pathname === to;
    const userLabel = user?.email?.split('@')[0] || t('nav_account', lang);
    return (<nav className="fixed top-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur-md border-b border-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 relative">
              <div className="absolute inset-0 bg-gold/20 rotate-45 rounded-sm group-hover:bg-gold/30 transition-colors"/>
              <div className="absolute inset-1.5 bg-gold rotate-45 rounded-sm"/>
            </div>
            <span className="text-sm font-bold text-gold leading-tight hidden sm:block">
              BG Analysis<br />
              <span className="text-[10px] text-white/50 font-normal">XG Automation</span>
            </span>
          </Link>

          
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ key, to }) => (<Link key={key} to={to} className={`px-3 py-2 text-sm rounded transition-colors ${isActive(to)
                ? 'text-gold bg-gold/10'
                : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
                {t(key, lang)}
              </Link>))}
          </div>

          
          <div className="hidden md:flex items-center gap-2">
            
            <div className="relative">
              <button onClick={() => { setCurOpen(!curOpen); setLangOpen(false); }} className="flex items-center gap-1 px-2 py-1.5 text-xs text-white/60 hover:text-white border border-white/10 hover:border-gold/30 rounded transition-colors">
                {currency.symbol} {currency.code}
                <ChevronDown className="w-3 h-3"/>
              </button>
              {curOpen && (<div className="absolute right-0 top-full mt-1 bg-navy border border-gold/20 rounded-lg shadow-xl overflow-hidden z-50">
                  {currencies.map((c) => (<button key={c.code} onClick={() => { setCurrency(c); setCurOpen(false); }} className={`flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gold/10 transition-colors ${currency.code === c.code ? 'text-gold' : 'text-white/70'}`}>
                      {c.symbol} {c.code}
                    </button>))}
                </div>)}
            </div>

            
            <div className="relative">
              <button onClick={() => { setLangOpen(!langOpen); setCurOpen(false); }} className="flex items-center gap-1 px-2 py-1.5 text-xs text-white/60 hover:text-white border border-white/10 hover:border-gold/30 rounded transition-colors">
                <Globe className="w-3 h-3"/>
                {languages.find(l => l.code === lang)?.flag}
                <ChevronDown className="w-3 h-3"/>
              </button>
              {langOpen && (<div className="absolute right-0 top-full mt-1 bg-navy border border-gold/20 rounded-lg shadow-xl overflow-hidden z-50 w-36">
                  {languages.map((l) => (<button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); }} className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gold/10 transition-colors ${lang === l.code ? 'text-gold' : 'text-white/70'}`}>
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>))}
                </div>)}
            </div>

            {!isLoadingAuth && isAuthenticated ? (<>
                <Link to="/dashboard" className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/70 hover:text-white transition-colors">
                  <UserCircle2 className="w-4 h-4"/>
                  {userLabel}
                  <span className="text-xs px-2 py-1 rounded bg-gold/10 text-gold border border-gold/30">
                    {userPoints} pts
                  </span>
                </Link>
                <button type="button" onClick={() => logout()} className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/70 hover:text-white transition-colors">
                  <LogOut className="w-4 h-4"/>
                  {t('nav_logout', lang)}
                </button>
              </>) : (<>
                <Link to="/login" className="px-3 py-1.5 text-sm text-white/70 hover:text-white transition-colors">
                  {t('nav_login', lang)}
                </Link>
                <Link to="/register" className="px-3 py-1.5 text-sm text-white/70 hover:text-white transition-colors">
                  {t('nav_register_cta', lang)}
                </Link>
              </>)}
            <Link to="/upload" className="px-4 py-1.5 text-sm font-semibold bg-gold text-navy rounded hover:bg-gold/90 transition-colors">
              {t('hero_cta_upload', lang)}
            </Link>
          </div>

          
          <button className="md:hidden p-2 text-white/70 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
          </button>
        </div>
      </div>

      
      {mobileOpen && (<div className="md:hidden bg-navy border-t border-gold/20 px-4 py-4 space-y-1">
          {navLinks.map(({ key, to }) => (<Link key={key} to={to} onClick={() => setMobileOpen(false)} className={`block px-3 py-2 text-sm rounded transition-colors ${isActive(to) ? 'text-gold bg-gold/10' : 'text-white/70 hover:text-white'}`}>
              {t(key, lang)}
            </Link>))}
          <div className="pt-2 flex gap-2">
            {currencies.map((c) => (<button key={c.code} onClick={() => setCurrency(c)} className={`px-2 py-1 text-xs rounded border ${currency.code === c.code ? 'border-gold text-gold' : 'border-white/20 text-white/50'}`}>
                {c.symbol}{c.code}
              </button>))}
          </div>
          <div className="flex gap-2 flex-wrap pt-1">
            {languages.map((l) => (<button key={l.code} onClick={() => { setLang(l.code); setMobileOpen(false); }} className={`px-2 py-1 text-xs rounded border ${lang === l.code ? 'border-gold text-gold' : 'border-white/20 text-white/50'}`}>
                {l.flag} {l.label}
              </button>))}
          </div>
          {!isLoadingAuth && isAuthenticated ? (<>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm rounded text-white/70 hover:text-white">
                {t('nav_dashboard', lang)}
              </Link>
              <button type="button" onClick={() => {
                    setMobileOpen(false);
                    logout();
                }} className="block w-full text-left px-3 py-2 text-sm rounded text-white/70 hover:text-white">
                {t('nav_logout', lang)}
              </button>
            </>) : (<>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm rounded text-white/70 hover:text-white">
                {t('nav_login', lang)}
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm rounded text-white/70 hover:text-white">
                {t('nav_register_cta', lang)}
              </Link>
            </>)}
          <Link to="/upload" onClick={() => setMobileOpen(false)} className="block mt-2 text-center px-4 py-2 text-sm font-semibold bg-gold text-navy rounded">
            {t('hero_cta_upload', lang)}
          </Link>
        </div>)}
    </nav>);
}

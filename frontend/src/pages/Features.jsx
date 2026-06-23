import { Link } from 'react-router-dom';
import { Brain, Target, Zap, Shield, BarChart3, CheckCircle, Globe, Clock, Layers, Database, TrendingUp, Video } from 'lucide-react';
import { useLang } from '@/lib/useLang';
import { t } from '@/lib/i18n';
const coreFeatures = [
    { icon: Brain, title: 'Automatic Move Detection', desc: 'Neural networks trained on thousands of backgammon games detect every checker movement with >98% accuracy. Works with any board style or colour scheme.', badge: 'Core' },
    { icon: Target, title: 'Dice Recognition', desc: 'Advanced computer vision reads dice values from video frames and images. Handles motion blur, partial occlusion, and various die types.', badge: 'Core' },
    { icon: Shield, title: 'Board Recognition', desc: 'Full board state detection including checker positions, bar count, home board, and cube position at any moment in the match.', badge: 'Core' },
    { icon: Zap, title: 'XG Export', desc: 'Direct export to Extreme Gammon .mat format. Import in one click — no manual data entry, no formatting issues.', badge: 'Core' },
    { icon: Layers, title: 'Match Reconstruction', desc: 'Rebuilds the complete legal move history from raw footage, filling any gaps using backgammon rules and AI inference.', badge: 'Core' },
    { icon: CheckCircle, title: 'Manual Correction Tools', desc: 'Intuitive board interface lets you verify and correct any AI detection errors before downloading your analysis.', badge: 'Core' },
    { icon: Video, title: 'Video Analysis', desc: 'Upload full match recordings. Our AI scrubs through the footage and extracts every move automatically.', badge: 'Core' },
    { icon: Globe, title: 'Screenshot Analysis', desc: 'Perfect for online matches. Upload a series of position screenshots and let AI reconstruct the full game.', badge: 'Core' },
    { icon: CheckCircle, title: 'AI-Assisted Validation', desc: 'Every reconstructed move is validated against backgammon rules and flagged if it appears illegal or suspicious.', badge: 'Core' },
];
const futureFeatures = [
    { icon: Clock, title: 'Live Board Tracking', desc: 'Real-time tracking of a live board via overhead camera. Analysis as you play.' },
    { icon: Zap, title: 'Real-Time Analysis', desc: 'Instant equity calculations and blunder alerts during live matches.' },
    { icon: Database, title: 'Cloud Storage', desc: 'All your matches stored and searchable in the cloud with full history.' },
    { icon: BarChart3, title: 'Statistics Dashboard', desc: 'Long-term PR trends, weakness heatmaps, and improvement tracking over time.' },
    { icon: TrendingUp, title: 'Equity Graphs', desc: 'Visual equity curve for each match showing key turning points and blunders.' },
    { icon: Database, title: 'Match Database', desc: 'Build a personal database of all your matches for study and pattern analysis.' },
];
export default function Features() {
    const { lang } = useLang();
    return (<div className="min-h-screen bg-background py-20 px-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-gold text-sm font-mono-data uppercase tracking-widest mb-3">{t('features_badge', lang)}</p>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">{t('features_title', lang)}</h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            {t('features_subtitle', lang)}
          </p>
        </div>

        
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gold/20"/>
            <span className="text-gold text-sm font-mono-data uppercase tracking-widest">{t('features_available_now', lang)}</span>
            <div className="h-px flex-1 bg-gold/20"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {coreFeatures.map(({ icon: Icon, title, desc, badge }) => (<div key={title} className="glass rounded-xl p-6 hover:border-gold/30 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                    <Icon className="w-5 h-5 text-gold"/>
                  </div>
                  <span className="px-2 py-0.5 bg-gold/10 text-gold text-xs rounded font-mono-data">{badge}</span>
                </div>
                <h3 className="text-white font-bold mb-2">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </div>))}
          </div>
        </div>

        
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-white/10"/>
            <span className="text-white/40 text-sm font-mono-data uppercase tracking-widest">{t('features_coming_soon', lang)}</span>
            <div className="h-px flex-1 bg-white/10"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {futureFeatures.map(({ icon: Icon, title, desc }) => (<div key={title} className="glass rounded-xl p-6 opacity-60 hover:opacity-80 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white/40"/>
                  </div>
                  <span className="px-2 py-0.5 bg-white/5 text-white/40 text-xs rounded font-mono-data">{t('features_roadmap', lang)}</span>
                </div>
                <h3 className="text-white/70 font-bold mb-2">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>))}
          </div>
        </div>

        
        <div className="glass rounded-2xl p-10 text-center border-gold/20">
          <h2 className="text-2xl font-black text-white mb-3">{t('features_cta_title', lang)}</h2>
          <p className="text-white/50 mb-6">{t('features_cta_sub', lang)}</p>
          <Link to="/upload" className="inline-flex items-center gap-2 px-8 py-3 bg-gold text-navy font-black rounded-xl hover:bg-gold/90 transition-all hover:scale-105">
            {t('hero_cta_upload', lang)}
          </Link>
        </div>
      </div>
    </div>);
}

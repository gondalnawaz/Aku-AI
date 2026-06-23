import BoardCanvas from '@/components/BoardCanvas';
import { useLang } from '@/lib/useLang';
import { t } from '@/lib/i18n';
const DEMO_JOB = {
    file_name: 'demo_match_01.mp4',
    result_url: '/demo/demo_result.json',
};
export default function HeroDashboardDemo() {
    const { lang } = useLang();
    return (<div className="glass rounded-2xl p-4 animate-float hidden lg:block">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500"/>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"/>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500"/>
          <span className="ml-2 text-xs text-white/30 font-mono-data">demo_match_01.mp4</span>
        </div>
        <span className="text-[11px] px-2 py-1 rounded-full border border-green-500/40 text-green-300 bg-green-500/10 font-mono-data">
          {t('hero_demo_live', lang)}
        </span>
      </div>

      <div className="rounded-xl border border-white/10 bg-charcoal/40 p-2">
        <BoardCanvas job={DEMO_JOB} compact/>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-mono-data">
        <div className="rounded-lg bg-white/5 px-2 py-1.5 text-white/70">
          {t('hero_demo_source', lang)}: <span className="text-white">{t('hero_demo_video', lang)}</span>
        </div>
        <div className="rounded-lg bg-white/5 px-2 py-1.5 text-white/70">
          {t('hero_demo_output', lang)}: <span className="text-gold">XG JSON</span>
        </div>
        <div className="rounded-lg bg-white/5 px-2 py-1.5 text-white/70">
          {t('hero_demo_status', lang)}: <span className="text-green-300">{t('status_completed', lang)}</span>
        </div>
      </div>
    </div>);
}

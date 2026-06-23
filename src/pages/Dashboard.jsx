import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '@/lib/apiClient';
import { Upload, Clock, CheckCircle, XCircle, Loader2, Download, AlertCircle } from 'lucide-react';
import { useLang } from '@/lib/useLang';
import { t } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import BoardCanvas from '@/components/BoardCanvas';
import ReviewPromptCard from '@/components/ReviewPromptCard';

const STATUS_CONFIG = {
    pending_payment: { labelKey: 'status_pending_payment', color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-500/30', icon: Clock },
    queued: { labelKey: 'status_queued', color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-500/30', icon: Clock },
    processing: { labelKey: 'status_processing', color: 'text-gold', bg: 'bg-gold/10 border-gold/30', icon: Loader2 },
    completed: { labelKey: 'status_completed', color: 'text-green-400', bg: 'bg-green-900/20 border-green-500/30', icon: CheckCircle },
    failed: { labelKey: 'status_failed', color: 'text-red-400', bg: 'bg-red-900/20 border-red-500/30', icon: XCircle },
};
export default function Dashboard() {
    const { lang } = useLang();
    const auth = /** @type {any} */ (useAuth());
    const { isAuthenticated, user } = auth;
    const refreshUserPoints = auth.refreshUserPoints || (() => {});
    const [jobs, setJobs] = useState(/** @type {any[]} */ ([]));
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(/** @type {any | null} */ (null));
    const [hideReviewPrompt, setHideReviewPrompt] = useState(localStorage.getItem('review_prompt_hidden') === '1');
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('checkout') || urlParams.get('status');
    const sessionId = urlParams.get('session_id');
    /** @param {string} lookupEmail */
    const loadJobs = async (lookupEmail) => {
        setLoading(true);
        try {
            const results = await api.listJobs(lookupEmail);
          setJobs(results.sort((/** @type {any} */ a, /** @type {any} */ b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
          const completed = results.find((/** @type {any} */ j) => j.status === 'completed');
            if (completed)
                setSelectedJob(completed);
        }
        catch (e) {
            setJobs([]);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (!isAuthenticated)
            return;
        const userEmail = user?.email || localStorage.getItem('bg_last_email');
        if (userEmail)
            loadJobs(userEmail);
        else
            setLoading(false);
    }, [isAuthenticated, user]);
    useEffect(() => {
        if (paymentStatus === 'success' && sessionId) {
            refreshUserPoints();
        }
    }, [paymentStatus, refreshUserPoints, sessionId]);
    /** @param {any} job */
    const handleSelectJob = (job) => {
        setSelectedJob(job);
    };
    /** @param {string | number | Date} d */
    const formatDate = (d) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const dismissPrompt = () => {
        localStorage.setItem('review_prompt_hidden', '1');
        setHideReviewPrompt(true);
    };
    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }
    return (<div className="min-h-screen bg-background py-16 px-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-gold text-sm font-mono-data uppercase tracking-widest mb-3">{t('dashboard_badge', lang)}</p>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3">{t('dashboard_title', lang)}</h1>
          {paymentStatus === 'success' && (<div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-500/30 rounded-full text-green-400 text-sm mt-3">
              <CheckCircle className="w-4 h-4"/>
              {t('dashboard_payment_success', lang)}
            </div>)}
          {paymentStatus === 'cancelled' && (<div className="inline-flex items-center gap-2 px-4 py-2 bg-red-900/30 border border-red-500/30 rounded-full text-red-400 text-sm mt-3">
              <AlertCircle className="w-4 h-4"/>
              {t('dashboard_payment_cancelled', lang)}
            </div>)}
        </div>
        <div className="mt-8 text-center">
          <Link to="/upload" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm transition-colors">
            <Upload className="w-4 h-4"/>
            {t('dashboard_upload_another', lang)}
          </Link>
        </div>

        {loading ? (<div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-gold animate-spin"/>
          </div>) : jobs.length === 0 ? (<div className="text-center py-16 glass rounded-2xl">
            <Upload className="w-12 h-12 text-white/20 mx-auto mb-4"/>
            <p className="text-white/40 mb-4">{t('dashboard_no_jobs', lang)}</p>
            <Link to="/upload" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-navy font-bold rounded-lg hover:bg-gold/90 transition-colors">
              <Upload className="w-4 h-4"/>
              {t('nav_upload', lang)}
            </Link>
          </div>) : (<div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            
            <div className="glass rounded-2xl p-6 w-full lg:flex-1 lg:min-w-0">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"/>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"/>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"/>
                <span className="ml-2 text-xs text-white/60 font-sm">{t('dashboard_board_view', lang)}</span>
              </div>

              {selectedJob ? (selectedJob.status === 'completed' ? (<BoardCanvas job={selectedJob}/>) : (<div className="text-white/60 text-sm py-8 text-center">{t('dashboard_selected_not_completed', lang)}</div>)) : (<div className="text-white/60 text-sm py-8 text-center">{t('dashboard_select_job', lang)}</div>)}
            </div>

            
            <div className="glass rounded-2xl p-6 w-full lg:w-80 lg:flex-shrink-0">
              <p className="text-white/60 text-sm mb-4 sticky top-0">{t('dashboard_jobs_count', lang).replace('{count}', String(jobs.length))}</p>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {jobs.map((job) => {
                const statusKey = /** @type {keyof typeof STATUS_CONFIG} */ (job.status in STATUS_CONFIG ? job.status : 'queued');
                const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.queued;
                const Icon = cfg.icon;
                const isSelected = selectedJob?.id === job.id;
                return (<button key={job.id} type="button" onClick={() => handleSelectJob(job)} className={`w-full text-left p-4 rounded-xl border transition-colors ${isSelected ? 'bg-white/8 border-gold/40' : 'bg-white/0 border-white/10 hover:bg-white/5'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="w-full">
                          <div className="flex items-center gap-2 mb-1 justify-between">
                            <div className='flex items-center gap-2'>
                              <Icon className={`w-4 h-4 ${cfg.color} ${job.status === 'processing' ? 'animate-spin' : ''}`}/>
                              <span className={`text-sm font-semibold ${cfg.color}`}>{t(cfg.labelKey, lang)}</span>
                            </div>
                            {job.status === 'completed' && job.result_url && (<a href={job.result_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-gold/10 text-gold border border-gold/30 rounded-lg text-sm hover:bg-gold/20 transition-colors whitespace-nowrap">
                                <Download className="w-3.5 h-3.5"/>
                                {t('common_download', lang)}
                              </a>)}
                          </div>
                          <div className="text-white font-medium">{job.file_name || t('dashboard_match_file', lang)}</div>
                          <div className="text-xs text-white/40">
                            #{String(job.id).slice(-6).toUpperCase()} • {job.service_speed} • {formatDate(job.created_date)}
                          </div>
                        </div>
                      </div>
                    </button>);
            })}
              </div>
            </div>
          </div>)}

          <section className="py-10">
            <div className="mt-8">
              <ReviewPromptCard lang={lang} onDismiss={dismissPrompt} user={user}/>
            </div>
          </section>
      </div>
    </div>);
}

import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, X, CheckCircle, Zap, Clock, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/apiClient';
import { useLang, convertPrice } from '@/lib/useLang';
import { t } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext'; // adjust path if your auth hook lives elsewhere
const PLANS = [
	{
		key: 'trial',
		labelKey: 'plan_trial',
		durationKey: 'trial_feature_video_limit',
		gbpPrice: 0,
		points: 0,
		icon: Calendar,
		color: 'grey',
	},
	{
		key: 'standard',
		labelKey: 'plan_standard',
		durationKey: 'standard_feature_points',
		gbpPrice: 12,
		points: 3,
		icon: Clock,
		color: 'blue',
	},
	{
		key: 'quick',
		labelKey: 'plan_quick',
		durationKey: 'quick_feature_points',
		gbpPrice: 16,
		points: 4,
		icon: Zap,
		color: 'gold',
	},
];
const TRIAL_MAX_BYTES = 100 * 1024 * 1024;

/** @param {any} user */
const getUserPoints = (user) => {
    const candidates = [
        user?.points,
        user?.credit_points,
        user?.credits,
        user?.wallet_points,
        user?.balance_points,
    ];
    const value = candidates.find(v => Number.isFinite(v));
    return Number.isFinite(value) ? Number(value) : 0;
};

export default function Upload() {
	// Replace any `files` / `selectedFiles` array state with single-file state
	const { lang, currency } = useLang();
	const navigate = useNavigate();
	const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
	const meta = /** @type {any} */ (import.meta);
	const apiBaseUrl = meta.env?.VITE_API_BASE_URL || 'http://localhost:8000';
	const urlParams = new URLSearchParams(window.location.search);
	const [selectedPlan, setSelectedPlan] = useState(urlParams.get('plan') || 'standard');
	const [selectedFile, setSelectedFile] = useState(/** @type {File | null} */ (null));
	const [dragging, setDragging] = useState(false);
	const [email, setEmail] = useState('');
	const [notes, setNotes] = useState('');
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [error, setError] = useState('');
	const { user, isAuthenticated } = useAuth();
	const handleDrop = useCallback((/** @type {any} */ e) => {
		e.preventDefault();
		setDragging(false);
		const file = e.dataTransfer?.files?.[0] || null;
		setSelectedFile(file);
	}, []);
	// Replace your current file-change handler
	const handleFileChange = (/** @type {any} */ e) => {
		const file = e.target.files?.[0] || null;
		setSelectedFile(file);
	};
	const removeFile = () => setSelectedFile(null);
	const handleSubmit = async () => {
		if (!email) {
			setError(t('upload_error_email_required', lang));
			return;
		}
		if (!selectedFile) {
			setError(t('upload_error_file_required', lang));
			return;
		}

		const currentPlan = PLANS.find(p => p.key === selectedPlan) || PLANS[1];

		// // 1) Trial file size limit: 100MB
		// if (selectedPlan === 'trial' && selectedFile.size > TRIAL_MAX_BYTES) {
		// 	setError(t('upload_error_trial_file_limit', lang) || 'Trial allows files up to 100 MB.');
		// 	return;
		// }

		// // 2) Non-trial points check
		// if (selectedPlan !== 'trial') {
		// 	if (!isAuthenticated) {
		// 		setError(t('upload_error_signin_required', lang) || 'Please sign in to use points.');
		// 		return;
		// 	}
		// 	const availablePoints = getUserPoints(user);
		// 	const requiredPoints = currentPlan.points || 0;

		// 	if (availablePoints < requiredPoints) {
		// 		setError(
		// 			(t('upload_error_insufficient_points', lang) || 'Not enough points. Required: {required}, Available: {available}')
		// 				.replace('{required}', String(requiredPoints))
		// 				.replace('{available}', String(availablePoints))
		// 		);
		// 		return;
		// 	}
		// }

		const isIframe = window.self !== window.top;
		if (isIframe) {
			alert(t('upload_error_checkout_preview', lang));
			return;
		}

		setError('');
		setUploading(true);
		setUploadProgress(20);

		try {
			const formData = new FormData();
			formData.append('file', selectedFile);

			const uploadRes = await fetch(`${apiBaseUrl}/upload`, {
				method: 'POST',
				body: formData,
			});

			if (!uploadRes.ok) {
				let msg = t('upload_error_upload_failed', lang);
				try {
					const err = await uploadRes.json();
					msg = err?.detail || msg;
				} catch {}
				throw new Error(msg);
			}

			const { file_url } = await uploadRes.json();
			if (!file_url) {
				throw new Error(t('upload_error_missing_file_url', lang));
			}

			setUploadProgress(60);

			const file = /** @type {File} */ (selectedFile);
			await api.createJob({
				user_email: email,
				file_url,
				file_name: file.name,
				file_size_bytes: file.size,
				file_type: file.type.startsWith('video/')
					? 'video'
					: file.type.startsWith('image/')
					? 'image'
					: 'notation',
				service_speed: selectedPlan,
				notes,
				currency: currency.code,
				language: lang,
			});

			setUploadProgress(100);

			// Checkout removed: user already paid with points
			navigate('/dashboard');
		} catch (err) {
			setError((/** @type {any} */ (err))?.message || t('upload_error_generic', lang));
		} finally {
			setUploading(false);
		}
	};
	const plan = PLANS.find(p => p.key === selectedPlan) || PLANS[1];
	return (<div className="min-h-screen bg-background py-16 px-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
		<div className="max-w-4xl mx-auto">
			<div className="text-center mb-12">
				<p className="text-gold text-sm font-mono-data uppercase tracking-widest mb-3">{t('upload_badge', lang)}</p>
				<h1 className="text-3xl md:text-4xl font-black text-white mb-3">{t('upload_title', lang)}</h1>
				<p className="text-white/50">{t('upload_sub', lang)}</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

				<div className="lg:col-span-3 space-y-6">

					<div onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onClick={() => fileInputRef.current?.click()} className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragging
			? 'border-gold bg-gold/10 scale-[1.02]'
			: 'border-white/20 hover:border-gold/50 hover:bg-white/2'}`}>
						<input ref={fileInputRef} type="file" accept="video/*,image/*,.txt,.mat" className="hidden" onChange={handleFileChange}/>
						<div className="flex flex-col items-center gap-4">
							<div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${dragging ? 'bg-gold/20' : 'bg-white/5'}`}>
								<UploadIcon className={`w-8 h-8 ${dragging ? 'text-gold' : 'text-white/40'}`}/>
							</div>
							<div>
								<p className="text-white font-semibold mb-1">
									{dragging ? t('upload_drop_now', lang) : t('upload_drag_drop', lang)}
								</p>
								<p className="text-white/40 text-sm">{t('upload_formats_hint', lang)}</p>
							</div>
						</div>
					</div>


					{selectedFile && (<div className="glass rounded-lg px-4 py-3 flex items-center gap-3">
						<span className="text-lg">
							{selectedFile.type.startsWith('video/') ? '🎥' : selectedFile.type.startsWith('image/') ? '📷' : '📄'}
						</span>
						<div className="flex-1 min-w-0">
							<p className="text-white text-sm font-medium truncate">{selectedFile.name}</p>
							<p className="text-white/40 text-xs">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
						</div>
						<button onClick={removeFile} className="text-white/30 hover:text-red-400 transition-colors">
							<X className="w-4 h-4"/>
						</button>
					</div>)}


					<div>
						<label className="block text-white/60 text-sm mb-2">{t('upload_email_label', lang)}</label>
						<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('upload_email_placeholder', lang)} className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold/50 transition-colors"/>
					</div>


					<div>
						<label className="block text-white/60 text-sm mb-2">{t('upload_notes_label', lang)}</label>
						<textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('upload_notes_placeholder', lang)} rows={3} className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold/50 transition-colors resize-none"/>
					</div>

					{error && (<div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
						<AlertCircle className="w-4 h-4 flex-shrink-0"/>
						{error}
					</div>)}
				</div>


				<div className="lg:col-span-2 space-y-4">
					<h3 className="text-white font-semibold text-sm uppercase tracking-wider">{t('upload_select_service', lang)}</h3>
					{PLANS.map(({ key, labelKey, durationKey, gbpPrice, points, icon: Icon }) => (<button key={key} onClick={() => setSelectedPlan(key)} className={`w-full glass rounded-xl p-4 text-left transition-all ${selectedPlan === key ? 'border-gold/60 bg-gold/5' : 'hover:border-white/30'}`}>
						<div className="flex items-center gap-3">
							<div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedPlan === key ? 'bg-gold/20' : 'bg-white/5'}`}>
								<Icon className={`w-4 h-4 ${selectedPlan === key ? 'text-gold' : 'text-white/40'}`}/>
							</div>
							<div className="flex-1">
								<p className={`text-sm font-semibold ${selectedPlan === key ? 'text-gold' : 'text-white'}`}>
									{t(labelKey, lang)}
								</p>
								<p className="text-white/40 text-xs">{t(durationKey, lang)}</p>
							</div>
							<div className="text-right">
								<p className={`font-black font-mono-data ${selectedPlan === key ? 'text-gold' : 'text-white'}`}>
								{points} pt{points > 1 ? 's' : ''}
								</p>
								<p className="text-white/30 text-xs">{currency.symbol}{convertPrice(gbpPrice, currency)}</p>
							</div>
							{selectedPlan === key && (<CheckCircle className="w-4 h-4 text-gold ml-1"/>)}
						</div>
					</button>))}


					<div className="glass rounded-xl p-5 border-gold/20 mt-4">
						<h4 className="text-white/60 text-xs uppercase tracking-wider mb-3">{t('upload_order_summary', lang)}</h4>
						<div className="space-y-2 text-sm mb-4">
							<div className="flex justify-between">
								<span className="text-white/50">{t(plan.labelKey, lang)}</span>
								<span className="text-white font-mono-data">{currency.symbol}{convertPrice(plan.gbpPrice, currency)}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-white/50">{t('common_processing', lang)}</span>
								<span className="text-white/80 font-mono-data text-xs">{t(plan.durationKey, lang)}</span>
							</div>
						</div>
						<div className="border-t border-white/10 pt-3 flex justify-between">
							<span className="text-white font-bold">{t('common_total', lang)}</span>
							<span className="text-gold font-black font-mono-data text-lg">
							{plan.points} pt{plan.points > 1 ? 's' : ''}
							</span>
						</div>

						<button onClick={handleSubmit} disabled={uploading} className="mt-4 w-full py-3 bg-gold text-navy font-black rounded-xl hover:bg-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
							{uploading ? (<>
								<Loader2 className="w-4 h-4 animate-spin"/>
								{t('upload_processing_progress', lang).replace('{progress}', String(uploadProgress))}
							</>) : (<>
								<UploadIcon className="w-4 h-4"/>
								{t('upload_btn', lang)}
							</>)}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>);
}

import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authClient } from "@/api/authClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { useLang } from '@/lib/useLang';
import { t } from '@/lib/i18n';
export default function Register() {
    const { lang } = useLang();
    const [searchParams] = useSearchParams();
    const initialEmail = searchParams.get("email") || "";
    const startInVerifyMode = searchParams.get("verify") === "1";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [debugOtp, setDebugOtp] = useState("");
    React.useEffect(() => {
        if (initialEmail) {
            setEmail(initialEmail);
        }
        if (startInVerifyMode && initialEmail) {
            setShowOtp(true);
        }
    }, [initialEmail, startInVerifyMode]);
    React.useEffect(() => {
        if (!startInVerifyMode || !initialEmail) {
            return;
        }
        let cancelled = false;
        const sendOtp = async () => {
            try {
                const result = await authClient.auth.resendOtp(initialEmail);
                if (!cancelled) {
                    setDebugOtp(result?.debug_otp || "");
                }
            }
            catch {
            }
        };
        sendOtp();
        return () => {
            cancelled = true;
        };
    }, [initialEmail, startInVerifyMode]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (password !== confirmPassword) {
            setError(t('auth_password_mismatch', lang));
            return;
        }
        setLoading(true);
        try {
            const result = await authClient.auth.register({ email, password });
            setDebugOtp(result?.debug_otp || "");
            setShowOtp(true);
        }
        catch (err) {
            setError(err.message || t('auth_registration_failed', lang));
        }
        finally {
            setLoading(false);
        }
    };
    const handleVerify = async () => {
        setError("");
        setLoading(true);
        try {
            const result = await authClient.auth.verifyOtp({ email, otpCode });
            if (result?.access_token) {
                authClient.auth.setToken(result.access_token);
            }
            window.location.href = "/";
        }
        catch (err) {
            setError(err.message || t('auth_invalid_verification_code', lang));
        }
        finally {
            setLoading(false);
        }
    };
    const handleResend = async () => {
        setError("");
        try {
            const result = await authClient.auth.resendOtp(email);
            setDebugOtp(result?.debug_otp || "");
            toast({
                title: t('auth_code_sent', lang),
                description: result?.email_sent === false
                    ? t('auth_code_sent_email_failed', lang)
                    : t('auth_code_sent_check_email', lang),
            });
        }
        catch (err) {
            setError(err.message || t('auth_resend_failed', lang));
        }
    };
    const handleGoogle = () => {
        authClient.auth.loginWithProvider("google", "/");
    };
    if (showOtp) {
        return (<AuthLayout icon={Mail} title={t('auth_verify_email_title', lang)} subtitle={t('auth_verify_email_subtitle', lang).replace('{email}', email)}>
        {error && (<div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>)}
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0}/>
              <InputOTPSlot index={1}/>
              <InputOTPSlot index={2}/>
              <InputOTPSlot index={3}/>
              <InputOTPSlot index={4}/>
              <InputOTPSlot index={5}/>
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="w-full h-12 font-medium" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
          {loading ? (<>
              <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
              {t('auth_verifying', lang)}
            </>) : (t('auth_verify_button', lang))}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {t('auth_didnt_receive', lang)}{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
            {t('auth_resend', lang)}
          </button>
        </p>
        {debugOtp && (<div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800">
            {t('auth_dev_otp', lang)} <span className="font-semibold tracking-widest">{debugOtp}</span>
          </div>)}
      </AuthLayout>);
    }
    return (<AuthLayout icon={UserPlus} title={t('auth_create_account_title', lang)} subtitle={t('auth_create_account_subtitle', lang)} footer={<>
          {t('auth_already_have_account', lang)}{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t('auth_login_button', lang)}
          </Link>
        </>}>
      <Button variant="outline" className="w-full h-12 text-sm font-medium mb-6" onClick={handleGoogle}>
        <GoogleIcon className="w-5 h-5 mr-2"/>
        {t('auth_continue_google', lang)}
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"/>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">{t('common_or', lang)}</span>
        </div>
      </div>

      {error && (<div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>)}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('auth_email', lang)}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true"/>
            <Input id="email" type="email" autoComplete="email" autoFocus placeholder={t('upload_email_placeholder', lang)} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required/>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('auth_password', lang)}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true"/>
            <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" required/>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{t('auth_confirm_password', lang)}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true"/>
            <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-12" required/>
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (<>
              <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
              {t('auth_creating_account', lang)}
            </>) : (t('auth_create_account_button', lang))}
        </Button>
      </form>
    </AuthLayout>);
}

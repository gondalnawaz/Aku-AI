import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authClient } from "@/api/authClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { useLang } from '@/lib/useLang';
import { t } from '@/lib/i18n';
export default function Login() {
    const navigate = useNavigate();
    const { lang } = useLang();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            navigate("/", { replace: true });
        }
        catch (err) {
            const authError = err;
            if (authError?.status === 403 && (authError?.message || "").toLowerCase().includes("verify your email")) {
                navigate(`/register?email=${encodeURIComponent(email)}&verify=1`);
                return;
            }
            setError(authError?.message || t('auth_invalid_email_password', lang));
        }
        finally {
            setLoading(false);
        }
    };
    const handleGoogle = () => {
        authClient.auth.loginWithProvider("google", "/");
    };
    return (<AuthLayout icon={LogIn} title={t('auth_login_title', lang)} subtitle={t('auth_login_subtitle', lang)} footer={<>
          {t('auth_no_account', lang)}{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            {t('auth_create_one', lang)}
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t('auth_password', lang)}</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              {t('auth_forgot_password', lang)}
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true"/>
            <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" required/>
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (<>
              <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
              {t('auth_logging_in', lang)}
            </>) : (t('auth_login_button', lang))}
        </Button>
      </form>
    </AuthLayout>);
}

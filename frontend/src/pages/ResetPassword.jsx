import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authClient } from "@/api/authClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useLang } from '@/lib/useLang';
import { t } from '@/lib/i18n';
export default function ResetPassword() {
    const { lang } = useLang();
    const [searchParams] = useSearchParams();
    const resetToken = searchParams.get("token");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (newPassword !== confirmPassword) {
            setError(t('auth_password_mismatch', lang));
            return;
        }
        setLoading(true);
        try {
            await authClient.auth.resetPassword({ resetToken, newPassword });
            window.location.href = "/login";
        }
        catch (err) {
            setError(err.message || t('auth_reset_failed', lang));
        }
        finally {
            setLoading(false);
        }
    };
    if (!resetToken) {
        return (<AuthLayout icon={AlertTriangle} title={t('auth_invalid_link_title', lang)} subtitle={t('auth_invalid_link_subtitle', lang)} footer={<Link to="/forgot-password" className="text-primary font-medium hover:underline">
            {t('auth_request_new_link', lang)}
          </Link>}>
        <p className="text-sm text-foreground text-center">
          {t('auth_invalid_link_body', lang)}
        </p>
      </AuthLayout>);
    }
    return (<AuthLayout icon={Lock} title={t('auth_new_password_title', lang)} subtitle={t('auth_new_password_subtitle', lang)}>
      {error && (<div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>)}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">{t('auth_new_password', lang)}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true"/>
            <Input id="password" type="password" autoComplete="new-password" autoFocus placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10 h-12" required/>
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
              {t('auth_resetting', lang)}
            </>) : (t('auth_reset_password_button', lang))}
        </Button>
      </form>
    </AuthLayout>);
}

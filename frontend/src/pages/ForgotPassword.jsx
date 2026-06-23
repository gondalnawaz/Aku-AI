import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authClient } from "@/api/authClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useLang } from '@/lib/useLang';
import { t } from '@/lib/i18n';
export default function ForgotPassword() {
    const { lang } = useLang();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authClient.auth.resetPasswordRequest(email);
        }
        catch {
        }
        finally {
            setLoading(false);
            setSent(true);
        }
    };
    return (<AuthLayout icon={Mail} title={t('auth_reset_title', lang)} subtitle={t('auth_reset_subtitle', lang)} footer={<Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1"/>{t('auth_back_to_login', lang)}
        </Link>}>
      {sent ? (<p className="text-sm text-foreground text-center">
          {t('auth_reset_email_sent', lang)}
        </p>) : (<form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth_email_address', lang)}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true"/>
              <Input id="email" type="email" autoComplete="email" autoFocus placeholder={t('upload_email_placeholder', lang)} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required/>
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (<>
                <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                {t('auth_sending', lang)}
              </>) : (t('auth_send_reset_link', lang))}
          </Button>
        </form>)}
    </AuthLayout>);
}

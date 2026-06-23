import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LangContext } from '@/lib/useLang';
import { useLangState } from '@/lib/useLang';
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SiteLayout from './components/SiteLayout';
import ScrollToTop from "./components/ScrollToTop";

const AuthenticatedApp = () => {
    const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
    if (isLoadingPublicSettings || isLoadingAuth) {
        return (<div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-gold/30 border-t-gold rounded-full animate-spin"></div>
      </div>);
    }
    if (authError && authError.type === 'user_not_registered') {
        return <UserNotRegisteredError />;
    }
    return (<Routes>
      
      <Route path="/login" element={<Login />}/>
      <Route path="/register" element={<Register />}/>
      <Route path="/forgot-password" element={<ForgotPassword />}/>
      <Route path="/reset-password" element={<ResetPassword />}/>

      
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />}/>
        <Route path="/how-it-works" element={<HowItWorks />}/>
        <Route path="/features" element={<Features />}/>
        <Route path="/pricing" element={<Pricing />}/>
        <Route path="/upload" element={<Upload />}/>
        <Route path="/dashboard" element={<Dashboard />}/>
      </Route>

      <Route path="*" element={<PageNotFound />}/>
    </Routes>);
};
function AppWithLang() {
    const langState = useLangState();
    return (
        <LangContext.Provider value={langState}>
            <AuthProvider>
                <QueryClientProvider client={queryClientInstance}>
                    <ScrollToTop />
                    <AuthenticatedApp />
                    <Toaster />
                </QueryClientProvider>
            </AuthProvider>
        </LangContext.Provider>
    );
}

export default function App() {
    return <AppWithLang />;
}

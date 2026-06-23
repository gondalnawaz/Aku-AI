import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { authClient } from '@/api/authClient';
import { api } from "@/lib/apiClient";
const AuthContext = createContext(/** @type {any} */ (null));
/** @param {{ children: React.ReactNode }} props */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(/** @type {any | null} */ (null));
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [authError, setAuthError] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [userPoints, setUserPoints] = useState(0);
    const checkUserAuth = useCallback(async () => {
        setIsLoadingAuth(true);
        setAuthError(null);
        try {
            const currentUser = await authClient.auth.me();
            setUser(currentUser);
            setIsAuthenticated(true);
        }
        catch (error) {
            const authError = /** @type {any} */ (error);
            setUser(null);
            setIsAuthenticated(false);
            if (authError?.status === 401 || authError?.status === 403) {
                authClient.auth.clearToken();
            }
        }
        finally {
            setIsLoadingAuth(false);
            setAuthChecked(true);
        }
    }, []);
    useEffect(() => {
        checkUserAuth();
    }, [checkUserAuth]);
    const login = useCallback(async (/** @type {string} */ email, /** @type {string} */ password) => {
        setIsLoadingAuth(true);
        setAuthError(null);
        try {
            const loginResult = await authClient.auth.loginViaEmailPassword(email, password);
            const currentUser = await authClient.auth.me();
            setUser(currentUser);
            setIsAuthenticated(true);
            setAuthChecked(true);
            return { ...loginResult, user: currentUser };
        }
        catch (error) {
            setUser(null);
            setIsAuthenticated(false);
            throw error;
        }
        finally {
            setIsLoadingAuth(false);
        }
    }, []);
    const checkAppState = checkUserAuth;
    const logout = useCallback((shouldRedirect = true) => {
        setUser(null);
        setIsAuthenticated(false);
        setAuthChecked(true);
        setUserPoints(0);
        authClient.auth.clearToken();
        if (shouldRedirect) {
            window.location.href = '/login';
        }
    }, []);
    const navigateToLogin = useCallback(() => {
        window.location.href = '/login';
    }, []);
    const refreshUserPoints = useCallback(async () => {
        const currentUser = /** @type {any} */ (user);
        if (!currentUser?.email) {
            setUserPoints(0);
            return;
        }
        try {
            const data = await api.getUserPoints(currentUser.email);
            setUserPoints(data?.points ?? 0);
        } catch {
            setUserPoints(0);
        }
    }, [user]);
    useEffect(() => {
        refreshUserPoints();
    }, [refreshUserPoints]);
    const value = useMemo(() => ({
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings: false,
        appPublicSettings: null,
        authError,
        authChecked,
        login,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
        userPoints,
        refreshUserPoints,
    }), [
        user,
        isAuthenticated,
        isLoadingAuth,
        authError,
        authChecked,
        login,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
        userPoints,
        refreshUserPoints,
    ]);
    return (<AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>);
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

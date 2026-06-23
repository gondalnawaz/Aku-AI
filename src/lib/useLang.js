import { useState, useEffect, createContext, useContext } from 'react';
import { currencies, languages } from './i18n';
import { api } from './apiClient';
export const LangContext = createContext({ lang: 'en', setLang: () => { }, currency: currencies[0], setCurrency: () => { } });
export function useLang() {
    return useContext(LangContext);
}
export function useLangState() {
    const [lang, setLang] = useState('en');
    const [currency, setCurrency] = useState(currencies[0]);
    useEffect(() => {
        let mounted = true;
        const supportedLanguages = new Set(languages.map(l => l.code));

        /** @param {string} nextLang */
        const setLangAndDir = (nextLang) => {
            if (!mounted)
                return;
            setLang(nextLang);
            document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
        };

        const initLocale = async () => {
            const saved = localStorage.getItem('bg_lang');
            const savedCur = localStorage.getItem('bg_currency');

            try {
                const locale = await api.detectLocale();

                if (saved !== locale?.language) {
                    const autoLang = supportedLanguages.has(locale?.language) ? locale.language : 'en';
                    localStorage.setItem('bg_lang', autoLang);
                    setLangAndDir(autoLang);
                }

                if (savedCur !== locale?.currency) {
                    const autoCurrency = currencies.find(c => c.code === locale?.currency) || currencies[0];
                    localStorage.setItem('bg_currency', autoCurrency.code);
                    if (mounted)
                        setCurrency(autoCurrency);
                }
            }
            catch (_) {
                if (!saved) {
                    const browserLang = (navigator.language || 'en').split('-')[0];
                    const fallbackLang = supportedLanguages.has(browserLang) ? browserLang : 'en';
                    localStorage.setItem('bg_lang', fallbackLang);
                    setLangAndDir(fallbackLang);
                }

                if (!savedCur && mounted) {
                    localStorage.setItem('bg_currency', currencies[0].code);
                    setCurrency(currencies[0]);
                }
            }
        };

        initLocale();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }, [lang]);

    /** @param {string} l */
    const handleSetLang = (l) => {
        setLang(l);
        localStorage.setItem('bg_lang', l);
        document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    };
    /** @param {{code:string, symbol:string, rate:number}} c */
    const handleSetCurrency = (c) => {
        setCurrency(c);
        localStorage.setItem('bg_currency', c.code);
    };
    return { lang, setLang: handleSetLang, currency, setCurrency: handleSetCurrency };
}
/** @param {number} gbpPrice @param {{rate:number}} currency */
export function convertPrice(gbpPrice, currency) {
    return (gbpPrice * currency.rate).toFixed(2);
}

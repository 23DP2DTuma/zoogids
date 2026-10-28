import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './en';
import lv from './lv';
import ru from './ru';

// Maza paša i18n sistēma: vārdnīcas lv / en / ru + konteksts valodas pārslēgšanai.
export const LANGS = { lv: 'LV', en: 'EN', ru: 'RU' };
const DICTS = { lv, en, ru };
const KEY = 'zg_lang';

let current = (() => {
    try {
        const saved = localStorage.getItem(KEY);
        return DICTS[saved] ? saved : 'lv';
    } catch {
        return 'lv';
    }
})();

export const getLang = () => current;

function lookup(dict, key) {
    return key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict);
}

/** Tulkojums pēc atslēgas ("nav.catalog"); {vārds} tiek aizstāts ar vars vērtību. Ja nav tulkojuma — latviešu teksts. */
export function t(key, vars) {
    let s = lookup(DICTS[current], key) ?? lookup(lv, key) ?? key;
    if (typeof s !== 'string') return s;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    return s;
}

const I18nContext = createContext({ lang: current, setLang: () => {}, t });

export function I18nProvider({ children }) {
    const [lang, setLangState] = useState(current);

    const setLang = useCallback((l) => {
        if (!DICTS[l]) return;
        current = l;
        try {
            localStorage.setItem(KEY, l);
        } catch {
            /* ignore */
        }
        setLangState(l);
    }, []);

    useEffect(() => {
        document.documentElement.lang = lang;
    }, [lang]);

    const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang]);
    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);

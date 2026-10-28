import axios from 'axios';
import { getLang, t } from '../lang';

// API klients Laravel backend'am: Sanctum SPA sesijas sīkdatne + XSRF žetons
const http = axios.create({
    baseURL: '/api',
    withCredentials: true,
    withXSRFToken: true,
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
});

http.interceptors.request.use((config) => {
    config.headers['X-Locale'] = getLang();
    return config;
});

export class ApiError extends Error {
    constructor(message, status, errors = {}) {
        super(message);
        this.status = status;
        this.errors = errors;
    }
}

/** CSRF sīkdatne pirms pieteikšanās / reģistrācijas. */
export const csrf = () => axios.get('/sanctum/csrf-cookie', { withCredentials: true });

/**
 * api(path, { method, body, params, quiet })
 * quiet: true — neizsaukt globālo 401/403 apstrādi (piem., pārbaudot, vai lietotājs pieteicies).
 */
export async function api(path, options = {}) {
    const { method = 'GET', body, params, quiet = false } = options;
    try {
        const res = await http.request({ url: path, method, data: body, params });
        return res.data;
    } catch (e) {
        const status = e.response?.status ?? 0;
        const data = e.response?.data || {};
        const first = data.errors ? Object.values(data.errors)[0]?.[0] : null;
        const message = first || data.message || (status === 0 ? t('errors.network') : t('errors.generic'));
        if (!quiet && status === 403) window.dispatchEvent(new CustomEvent('zg:forbidden'));
        if (!quiet && status === 401) window.dispatchEvent(new CustomEvent('zg:unauthenticated'));
        throw new ApiError(message, status, data.errors || {});
    }
}

/** Servera validācijas kļūdas formātā { lauks: 'teksts' }. */
export function fieldErrors(err) {
    return Object.fromEntries(Object.entries(err?.errors || {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
}

// Cenas vienmēr EUR ar 2 cipariem aiz komata: "18,99 €"
export const eur = (n) => `${Number(n || 0).toFixed(2).replace('.', ',')} €`;

// Vienots datuma formāts: DD.MM.GGGG
export function fmtDate(s) {
    if (!s) return '—';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).slice(0, 10));
    if (m && String(s).length <= 10) return `${m[3]}.${m[2]}.${m[1]}`;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '—';
    const pad = (x) => String(x).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** Šodienas datums YYYY-MM-DD (vietējā laika joslā). */
export function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const SPECIES = {
    suns: { icon: '🐕', get label() { return t('species.suns'); } },
    kaķis: { icon: '🐈', get label() { return t('species.kaķis'); } },
    grauzējs: { icon: '🐇', get label() { return t('species.grauzējs'); } },
    putns: { icon: '🦜', get label() { return t('species.putns'); } },
};

/** Produkta attēls: augšupielādēts fails (/storage/...) vai emoji. */
export const isImagePath = (img) => typeof img === 'string' && /[/.]/.test(img);
export const imageUrl = (img) => (img?.startsWith('http') || img?.startsWith('/') ? img : `/storage/${img}`);

/** Vecums mēnešos no dzimšanas datuma. */
export function ageMonths(birthdate) {
    if (!birthdate) return null;
    const b = new Date(birthdate);
    const n = new Date();
    return (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
}

export function ageLabel(birthdate) {
    const m = ageMonths(birthdate);
    if (m === null) return t('pets.ageUnknown');
    if (m < 12) return t('pets.ageMonths', { n: m });
    return t('pets.ageYears', { n: Math.floor(m / 12) });
}

/**
 * Barības kalkulators.
 * RER = 70 × svars^0.75; dienas enerģija = RER × koeficients (vecums, aktivitāte).
 */
export function calcDailyFood({ species, weight, months, activity = 'normal', kcalPer100g, packageWeight }) {
    const w = Number(weight);
    if (!w || w <= 0 || !kcalPer100g) return null;
    const rer = 70 * Math.pow(w, 0.75);
    let factor;
    if (species === 'kaķis') {
        factor = months !== null && months < 12 ? 2.5 : months !== null && months >= 120 ? 1.1 : 1.2;
    } else {
        factor = months !== null && months < 4 ? 3 : months !== null && months < 12 ? 2 : months !== null && months >= 84 ? 1.3 : 1.6;
    }
    factor *= { low: 0.85, normal: 1, high: 1.25 }[activity] ?? 1;
    const kcal = rer * factor;
    const grams = (kcal / kcalPer100g) * 100;
    const days = packageWeight ? Math.floor(packageWeight / grams) : null;
    return {
        kcal: Math.round(kcal),
        grams: Math.round(grams),
        days,
        interval: days ? Math.min(90, Math.max(7, days - 2)) : null,
    };
}

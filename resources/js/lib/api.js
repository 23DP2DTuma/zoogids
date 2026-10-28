// Vienkāršs API klients Laravel backend'am
export async function api(path, options = {}) {
    const res = await fetch(`/api${path}`, {
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const first = data.errors ? Object.values(data.errors)[0]?.[0] : null;
        throw new Error(first || data.message || 'Radās kļūda. Mēģiniet vēlreiz.');
    }
    return data;
}

// Cenas vienmēr EUR ar 2 cipariem aiz komata
export const eur = (n) => `${Number(n).toFixed(2).replace('.', ',')} €`;

// Vienots datuma formāts: DD.MM.GGGG
export const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('lv-LV', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—');

export const SPECIES = {
    suns: { label: 'Suns', icon: '🐕' },
    kaķis: { label: 'Kaķis', icon: '🐈' },
    grauzējs: { label: 'Grauzējs', icon: '🐇' },
    putns: { label: 'Putns', icon: '🦜' },
};

/** Vecums mēnešos no dzimšanas datuma. */
export function ageMonths(birthdate) {
    if (!birthdate) return null;
    const b = new Date(birthdate);
    const n = new Date();
    return (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
}

export function ageLabel(birthdate) {
    const m = ageMonths(birthdate);
    if (m === null) return 'vecums nav norādīts';
    if (m < 12) return `${m} mēn.`;
    const y = Math.floor(m / 12);
    return `${y} g.`;
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
    factor *= { low: 0.85, normal: 1, high: 1.25 }[activity];
    const kcal = rer * factor;
    const grams = (kcal / kcalPer100g) * 100;
    return {
        kcal: Math.round(kcal),
        grams: Math.round(grams),
        days: packageWeight ? Math.floor(packageWeight / grams) : null,
    };
}

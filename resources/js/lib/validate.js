import { t } from '../lang';
import { today } from './api';

// Klienta puses validācija ar tiem pašiem noteikumiem un tekstiem kā servera FormRequest.
const attr = (field) => t(`attr.${field}`);
const empty = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

export const required = (v, f) => (empty(v) ? t('val.required', { attribute: attr(f) }) : null);
export const max = (n) => (v, f) => (!empty(v) && String(v).length > n ? t('val.max', { attribute: attr(f), max: n }) : null);
export const email = (v) => (!empty(v) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? t('val.email') : null);
export const positive = (v, f) => (!empty(v) && !(Number(v) > 0) ? t(`val.positive_${f}`, { attribute: attr(f) }) : null);
export const decimals = (n) => (v, f) => (!empty(v) && !new RegExp(`^\\d+([.,]\\d{1,${n}})?$`).test(String(v)) ? t('val.decimal', { attribute: attr(f), decimal: n }) : null);
export const integer = (v, f) => (!empty(v) && !/^-?\d+$/.test(String(v)) ? t('val.integer', { attribute: attr(f) }) : null);
export const minNum = (n) => (v, f) => (!empty(v) && Number(v) < n ? t('val.minNum', { attribute: attr(f), min: n }) : null);
export const maxNum = (n) => (v, f) => (!empty(v) && Number(v) > n ? t('val.maxNum', { attribute: attr(f), max: n }) : null);
export const between = (a, b, key) => (v, f) => (!empty(v) && (Number(v) < a || Number(v) > b) ? t(key || 'val.between', { attribute: attr(f), min: a, max: b }) : null);
export const notFuture = (v, f) => (!empty(v) && String(v) > today() ? t('val.notFuture', { attribute: attr(f) }) : null);
export const oneOf = (list) => (v, f) => (!empty(v) && !list.includes(v) ? t('val.in', { attribute: attr(f) }) : null);
export const confirmed = (v, f, all) => (v !== all[`${f}_confirmation`] ? t('val.confirmed') : null);

/** Password::min(8)->mixedCase()->numbers()->symbols() */
export const password = (v, f) => {
    if (empty(v)) return null;
    if (v.length < 8) return t('val.minStr', { attribute: attr(f), min: 8 });
    if (!/[a-zāčēģīķļņšūž]/.test(v) || !/[A-ZĀČĒĢĪĶĻŅŠŪŽ]/.test(v)) return t('val.pwMixed');
    if (!/\d/.test(v)) return t('val.pwNumbers');
    if (!/[^\p{L}\p{N}\s]/u.test(v)) return t('val.pwSymbols');
    return null;
};

/** validate(values, { lauks: [noteikums, ...] }) → { lauks: 'pirmā kļūda' } */
export function validate(values, schema) {
    const errors = {};
    for (const [field, rules] of Object.entries(schema)) {
        for (const rule of rules) {
            const msg = rule(values[field], field, values);
            if (msg) {
                errors[field] = msg;
                break;
            }
        }
    }
    return errors;
}

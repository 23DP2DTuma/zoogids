import { useI18n } from '../lang';
import { ORDER_STATUSES, STATUS_STYLE, SUB_STATUSES } from '../lib/status';

export default function StatusBadge({ status }) {
    const { t } = useI18n();
    return <span className={`chip border ${STATUS_STYLE[status] || 'bg-black/5'}`}>{t(`status.${status}`)}</span>;
}

/** Statusa izvēle ar tām pašām krāsām kā emblēmai (gan pašam laukam, gan opcijām). */
export function StatusSelect({ value, onChange, kind = 'order', disabled, label }) {
    const { t } = useI18n();
    const list = kind === 'order' ? ORDER_STATUSES : SUB_STATUSES;
    return (
        <select aria-label={label || t('common.status')} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={`rounded-full border px-3 py-1 text-sm font-semibold ${STATUS_STYLE[value]}`}>
            {list.map((s) => (
                <option key={s} value={s} className={STATUS_STYLE[s]}>
                    {t(`status.${s}`)}
                </option>
            ))}
        </select>
    );
}

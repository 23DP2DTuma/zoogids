import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useConfirm } from '../components/ConfirmDialog';
import { Loading } from '../components/Guards';
import { useI18n } from '../lang';
import { api, fmtDate } from '../lib/api';
import { useStore } from '../lib/store';
import { Stars } from './Product';

/** Profila cilne: manas atsauksmes. */
export default function MyReviews() {
    const { t } = useI18n();
    const { notify } = useStore();
    const confirm = useConfirm();
    const [reviews, setReviews] = useState(null);

    const load = useCallback(() => api('/reviews/mine').then(setReviews).catch(() => setReviews([])), []);
    useEffect(() => {
        load();
    }, [load]);

    const remove = async (r) => {
        if (!(await confirm({ title: t('reviews.deleteConfirm') }))) return;
        try {
            await api(`/reviews/${r.id}`, { method: 'DELETE' });
            notify(t('reviews.deleted'));
            load();
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    if (!reviews) return <Loading />;
    if (reviews.length === 0) return <p className="text-ink/60">{t('reviews.mineEmpty')}</p>;

    return (
        <div className="grid gap-3 md:grid-cols-2">
            {reviews.map((r) => (
                <article key={r.id} className="card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link to={`/produkts/${r.product_id}`} className="font-bold hover:text-brand-600">
                            {r.product?.name}
                        </Link>
                        <span className={`chip text-xs ${r.is_visible ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{r.is_visible ? t('reviews.visible') : t('reviews.hidden')}</span>
                    </div>
                    <p className="mt-1 text-sm text-ink/50">
                        <Stars value={r.rating} /> · {fmtDate(r.created_at)}
                    </p>
                    {r.comment && <p className="mt-2 text-sm whitespace-pre-line">{r.comment}</p>}
                    <div className="mt-3 flex gap-2">
                        <Link to={`/produkts/${r.product_id}`} className="btn-ghost px-3 py-1.5 text-sm">
                            {t('common.edit')}
                        </Link>
                        <button className="btn-ghost px-3 py-1.5 text-sm text-red-600" onClick={() => remove(r)}>
                            {t('common.delete')}
                        </button>
                    </div>
                </article>
            ))}
        </div>
    );
}

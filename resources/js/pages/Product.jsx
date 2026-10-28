import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useConfirm } from '../components/ConfirmDialog';
import { Field } from '../components/Modal';
import { ProductImage } from '../components/ProductCard';
import { useI18n } from '../lang';
import { ageMonths, api, calcDailyFood, eur, fieldErrors, fmtDate, SPECIES } from '../lib/api';
import { useAuth } from '../lib/auth';
import { allergenHits, useStore } from '../lib/store';
import { between, max, required, validate } from '../lib/validate';
import NotFound from './NotFound';

export function Stars({ value, className = '' }) {
    const r = Math.round(Number(value) || 0);
    return (
        <span className={`text-sun ${className}`} aria-label={`${Number(value || 0).toFixed(1)} / 5`}>
            {'★'.repeat(r)}
            <span className="text-ink/20">{'★'.repeat(5 - r)}</span>
        </span>
    );
}

export default function Product() {
    const { t } = useI18n();
    const { id } = useParams();
    const { addToCart, activePet } = useStore();
    const [product, setProduct] = useState(null);
    const [qty, setQty] = useState(1);
    const [error, setError] = useState(null);

    const load = useCallback(() => api(`/products/${id}`).then(setProduct).catch((e) => setError(e)), [id]);
    useEffect(() => {
        load();
    }, [load]);

    if (error?.status === 404) return <NotFound />;
    if (error) return <p className="rounded-xl bg-red-50 p-4 text-red-700">{error.message}</p>;
    if (!product) return <p className="text-ink/60">{t('common.loading')}</p>;

    const hits = allergenHits(activePet, product);
    const wrongSpecies = activePet && activePet.species !== product.species;
    const calc =
        activePet && !wrongSpecies && product.kcal_per_100g
            ? calcDailyFood({ species: activePet.species, weight: activePet.weight, months: ageMonths(activePet.birth_date), activity: activePet.activity, kcalPer100g: product.kcal_per_100g, packageWeight: product.package_weight })
            : null;

    return (
        <div>
            <Link to="/katalogs" className="text-sm font-semibold text-brand-600">
                ← {t('product.back')}
            </Link>
            <div className="mt-4 grid gap-8 md:grid-cols-2">
                <div className="card grid aspect-square place-items-center overflow-hidden bg-brand-50 text-[7rem] sm:text-[9rem]">
                    <ProductImage product={product} />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink/60">
                        {product.brand?.name} · {product.category?.name} · {SPECIES[product.species]?.icon} {SPECIES[product.species]?.label}
                    </p>
                    <h1 className="mt-2 text-3xl font-extrabold break-words">{product.name}</h1>
                    <p className="mt-2">
                        <Stars value={product.rating} /> <span className="text-sm text-ink/60">{Number(product.rating).toFixed(1)} · {t('product.reviewsCount', { n: product.reviews?.length ?? 0 })}</span>
                    </p>
                    <p className="mt-4 text-ink/80">{product.description}</p>
                    {product.ingredients && (
                        <p className="mt-3 text-sm">
                            <b>{t('attr.ingredients')}:</b> {product.ingredients}
                        </p>
                    )}
                    {product.package_weight && (
                        <p className="mt-1 text-sm">
                            <b>{t('attr.package_weight')}:</b> {product.package_weight} g
                        </p>
                    )}
                    {product.problems?.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {product.problems.map((p) => (
                                <span key={p.id} className="chip bg-brand-100 text-brand-700">
                                    ✓ {p.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {hits.length > 0 && (
                        <p className="mt-4 rounded-xl bg-red-50 p-3 font-semibold text-red-700" role="alert">
                            ⚠️ {t('product.allergyWarning', { name: activePet.name, list: hits.join(', ') })}
                        </p>
                    )}
                    {wrongSpecies && (
                        <p className="mt-4 rounded-xl bg-amber-50 p-3 font-semibold text-amber-800" role="alert">
                            {t('product.speciesWarning', { name: activePet.name, species: SPECIES[product.species]?.label.toLowerCase() })}
                        </p>
                    )}
                    {calc && (
                        <div className="mt-4 rounded-xl bg-brand-50 p-4">
                            <p className="font-bold text-brand-700">⚖️ {t('product.doseFor', { name: activePet.name })}</p>
                            <p className="mt-1 text-sm">
                                {t('product.doseLine', { g: calc.grams })}
                                {calc.days && <> · {t('product.lastsLine', { n: calc.days, interval: calc.interval })}</>}
                            </p>
                        </div>
                    )}

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <span className="text-3xl font-extrabold">{eur(product.price)}</span>
                        <span className={`text-sm ${product.stock > 0 ? 'text-brand-600' : 'text-red-600'}`}>{product.stock > 0 ? t('product.inStock', { n: product.stock }) : t('product.outOfStock')}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <input type="number" aria-label={t('attr.quantity')} min={1} max={product.stock} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(product.stock, Number(e.target.value) || 1)))} className="input w-24" />
                        <button className="btn-primary flex-1" disabled={product.stock < 1} onClick={() => addToCart(product, qty)}>
                            {t('product.addToCart')}
                        </button>
                    </div>
                    <p className="mt-3 text-sm text-ink/60">🔁 {t('product.subscriptionHint')}</p>
                </div>
            </div>

            <Reviews product={product} onChange={load} />
        </div>
    );
}

/** Atsauksmes: redzamās atsauksmes + forma, ja lietotājs ir iegādājies produktu. */
function Reviews({ product, onChange }) {
    const { t } = useI18n();
    const { user } = useAuth();
    const { notify } = useStore();
    const confirm = useConfirm();
    const mine = product.my_review;
    const [form, setForm] = useState(null);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    const startForm = () => setForm(mine ? { rating: mine.rating, comment: mine.comment || '' } : { rating: 5, comment: '' });

    const submit = async (e) => {
        e.preventDefault();
        const errs = validate(form, { rating: [required, between(1, 5, 'val.rating')], comment: [max(1000)] });
        setErrors(errs);
        if (Object.keys(errs).length) return;
        setBusy(true);
        try {
            if (mine) await api(`/reviews/${mine.id}`, { method: 'PUT', body: form });
            else await api(`/products/${product.id}/reviews`, { method: 'POST', body: form });
            notify(mine ? t('reviews.updated') : t('reviews.created'));
            setForm(null);
            onChange();
        } catch (err) {
            setErrors(fieldErrors(err));
            notify(err.message, 'error');
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!(await confirm({ title: t('reviews.deleteConfirm') }))) return;
        try {
            await api(`/reviews/${mine.id}`, { method: 'DELETE' });
            notify(t('reviews.deleted'));
            onChange();
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    const reviews = product.reviews || [];

    return (
        <section className="mt-12">
            <h2 className="text-2xl font-extrabold">{t('reviews.title')}</h2>

            {user && product.can_review && !form && (
                <div className="mt-4 flex flex-wrap gap-2">
                    <button className="btn-primary" onClick={startForm}>
                        {mine ? t('reviews.editMine') : t('reviews.write')}
                    </button>
                    {mine && (
                        <button className="btn-ghost text-red-600" onClick={remove}>
                            {t('reviews.deleteMine')}
                        </button>
                    )}
                </div>
            )}
            {user && !product.can_review && <p className="mt-2 text-sm text-ink/60">{t('reviews.onlyBuyers')}</p>}
            {!user && (
                <p className="mt-2 text-sm text-ink/60">
                    <Link to={`/pieslegties?next=/produkts/${product.id}`} className="font-semibold text-brand-600">
                        {t('auth.login')}
                    </Link>
                    , {t('reviews.loginHint')}
                </p>
            )}
            {mine && !mine.is_visible && <p className="mt-2 text-sm text-amber-700">{t('reviews.hiddenMine')}</p>}

            {form && (
                <form onSubmit={submit} noValidate className="card mt-4 max-w-xl space-y-3 p-5">
                    <fieldset>
                        <legend className="label">{t('attr.rating')} *</legend>
                        <div className="flex gap-1 text-3xl">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button type="button" key={n} onClick={() => setForm({ ...form, rating: n })} className={n <= form.rating ? 'text-sun' : 'text-ink/20'} aria-label={t('reviews.stars', { n })} aria-pressed={n === form.rating}>
                                    ★
                                </button>
                            ))}
                        </div>
                        {errors.rating && <p className="text-sm text-red-600">{errors.rating}</p>}
                    </fieldset>
                    <Field label={t('attr.comment')} error={errors.comment} hint={`${form.comment.length}/1000`}>
                        <textarea className="input resize-y" rows={4} maxLength={1000} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
                    </Field>
                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn-ghost" onClick={() => setForm(null)}>
                            {t('common.cancel')}
                        </button>
                        <button className="btn-primary" disabled={busy}>
                            {t('common.save')}
                        </button>
                    </div>
                </form>
            )}

            <div className="mt-6 grid gap-3 md:grid-cols-2">
                {reviews.map((r) => (
                    <article key={r.id} className="card p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <b>{r.user?.name || t('reviews.anonymous')}</b>
                            <span className="text-sm text-ink/50">{fmtDate(r.created_at)}</span>
                        </div>
                        <Stars value={r.rating} />
                        {r.comment && <p className="mt-2 text-sm whitespace-pre-line text-ink/80">{r.comment}</p>}
                    </article>
                ))}
                {reviews.length === 0 && <p className="text-ink/60">{t('reviews.none')}</p>}
            </div>
        </section>
    );
}

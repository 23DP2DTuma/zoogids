import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Field } from '../components/Modal';
import ProductCard from '../components/ProductCard';
import { useI18n } from '../lang';
import { api, SPECIES } from '../lib/api';
import { useAuth } from '../lib/auth';
import { petFilterParams, useStore } from '../lib/store';

const EMPTY = { q: '', category: '', brand: '', species: '', min_price: '', max_price: '', sort: '', problem: '' };

export default function Catalog() {
    const { t } = useI18n();
    const { user } = useAuth();
    const { activePet, setActivePetId } = useStore();
    const [params] = useSearchParams();
    const [meta, setMeta] = useState(null);
    const [filters, setFilters] = useState(() => ({ ...EMPTY, q: params.get('q') || '', category: params.get('category') || '', problem: params.get('problem') || '' }));
    const [products, setProducts] = useState([]);
    const [page, setPage] = useState({ current: 1, last: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        api('/meta').then(setMeta).catch((e) => setError(e.message));
    }, []);

    const load = (pageNo, append) => {
        const all = { ...filters, ...petFilterParams(activePet), page: pageNo };
        const query = Object.fromEntries(Object.entries(all).filter(([, v]) => v !== '' && v != null));
        setLoading(true);
        return api('/products', { params: query })
            .then((res) => {
                setProducts((list) => (append ? [...list, ...res.data] : res.data));
                setPage({ current: res.current_page, last: res.last_page, total: res.total });
                setError(null);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    };

    // Meklēšana ar 200 ms aizturi
    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => load(1, false), 200);
        return () => clearTimeout(timer);
    }, [filters, activePet?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

    return (
        <div>
            <h1 className="text-3xl font-extrabold">{t('catalog.title')}</h1>
            {activePet ? (
                <p className="mt-2 rounded-xl bg-brand-50 px-4 py-3 text-brand-700">
                    {t('catalog.forPet', { name: activePet.name, species: SPECIES[activePet.species]?.label.toLowerCase() })}
                    {activePet.allergies && <> {t('catalog.withoutAllergen', { list: activePet.allergies })}</>}.{' '}
                    <button className="font-semibold underline" onClick={() => setActivePetId(null)}>
                        {t('catalog.showAll')}
                    </button>
                </p>
            ) : (
                <p className="mt-2 text-ink/70">
                    {t('catalog.tip')}{' '}
                    <Link to={user ? '/profils?tab=miluli' : '/registreties'} className="font-semibold text-brand-600">
                        {t('catalog.tipLink')}
                    </Link>
                </p>
            )}

            <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
                <aside className="card h-fit space-y-4 p-4" aria-label={t('catalog.filters')}>
                    <Field label={t('common.search')}>
                        <input className="input" type="search" value={filters.q} onChange={set('q')} placeholder={t('catalog.searchPh')} maxLength={100} />
                    </Field>
                    {!activePet && (
                        <Field label={t('attr.species')}>
                            <select className="input" value={filters.species} onChange={set('species')}>
                                <option value="">{t('catalog.allF')}</option>
                                {Object.entries(SPECIES).map(([k, s]) => (
                                    <option key={k} value={k}>
                                        {s.icon} {s.label}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    )}
                    <Field label={t('attr.category_id')}>
                        <select className="input" value={filters.category} onChange={set('category')}>
                            <option value="">{t('catalog.allF')}</option>
                            {meta?.categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.icon} {c.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label={t('attr.brand_id')}>
                        <select className="input" value={filters.brand} onChange={set('brand')}>
                            <option value="">{t('common.all')}</option>
                            {meta?.brands.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label={t('catalog.problem')}>
                        <select className="input" value={filters.problem} onChange={set('problem')}>
                            <option value="">{t('catalog.any')}</option>
                            {meta?.problems.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <fieldset>
                        <legend className="label">{t('catalog.price')}</legend>
                        <div className="flex gap-2">
                            <input className="input" type="number" min="0" aria-label={t('catalog.priceFrom')} placeholder={t('catalog.priceFrom')} value={filters.min_price} onChange={set('min_price')} />
                            <input className="input" type="number" min="0" aria-label={t('catalog.priceTo')} placeholder={t('catalog.priceTo')} value={filters.max_price} onChange={set('max_price')} />
                        </div>
                    </fieldset>
                    <button className="btn-ghost w-full" onClick={() => setFilters(EMPTY)}>
                        {t('catalog.clear')}
                    </button>
                </aside>

                <section>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-ink/60" aria-live="polite">
                            {loading && products.length === 0 ? t('common.loading') : t('catalog.found', { n: page.total })}
                        </p>
                        <select className="input w-auto" aria-label={t('catalog.sort')} value={filters.sort} onChange={set('sort')}>
                            <option value="">{t('catalog.sortDefault')}</option>
                            <option value="price_asc">{t('catalog.priceAsc')}</option>
                            <option value="price_desc">{t('catalog.priceDesc')}</option>
                            <option value="rating">{t('catalog.byRating')}</option>
                        </select>
                    </div>
                    {error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
                    {!loading && !error && products.length === 0 && (
                        <div className="card p-10 text-center text-ink/60">
                            <div className="text-5xl">🔍</div>
                            <p className="mt-3 font-semibold">{t('catalog.notFound')}</p>
                        </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {products.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                    {page.current < page.last && (
                        <div className="mt-6 text-center">
                            <button className="btn-ghost" disabled={loading} onClick={() => load(page.current + 1, true)}>
                                {loading ? t('common.loading') : t('common.loadMore')}
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

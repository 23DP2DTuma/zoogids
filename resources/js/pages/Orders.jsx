import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useConfirm } from '../components/ConfirmDialog';
import { Loading } from '../components/Guards';
import { ProductImage } from '../components/ProductCard';
import StatusBadge from '../components/StatusBadge';
import { useI18n } from '../lang';
import { api, eur, fmtDate } from '../lib/api';
import { useStore } from '../lib/store';
import { between, integer, required, validate } from '../lib/validate';
import NotFound from './NotFound';

/** Pasūtījuma apstiprinājums / detaļas: /pasutijums/:id */
export function OrderDetail() {
    const { t } = useI18n();
    const { id } = useParams();
    const { state } = useLocation();
    const [order, setOrder] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        api(`/orders/${id}`).then(setOrder).catch(setError);
    }, [id]);

    if (error?.status === 404) return <NotFound />;
    if (error) return <p className="rounded-xl bg-red-50 p-4 text-red-700">{error.message}</p>;
    if (!order) return <Loading />;

    const subtotal = order.items.reduce((s, i) => s + i.cena_bridi * i.quantity, 0);

    return (
        <div className="mx-auto max-w-2xl">
            <div className="card p-6 sm:p-8">
                {state?.justPlaced ? (
                    <div className="text-center">
                        <div className="text-6xl">🎉</div>
                        <h1 className="mt-3 text-2xl font-extrabold">{t('order.thanks', { id: order.id })}</h1>
                        <p className="mt-1 text-ink/60">{t('order.paidMock')}</p>
                    </div>
                ) : (
                    <h1 className="text-2xl font-extrabold">{t('order.title', { id: order.id })}</h1>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span>
                        {t('common.date')}: <b>{fmtDate(order.created_at)}</b>
                    </span>
                    <StatusBadge status={order.status} />
                </div>
                <p className="mt-2 text-sm">
                    {t(order.delivery_type === 'pakomāts' ? 'checkout.locker' : 'checkout.courier')}: <b className="break-words">{order.address}</b>
                </p>

                <ul className="mt-5 divide-y divide-black/5 border-y border-black/5">
                    {order.items.map((i) => (
                        <li key={i.id} className="flex items-center gap-3 py-3 text-sm">
                            <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-50 text-xl">{i.product && <ProductImage product={i.product} />}</span>
                            <span className="min-w-0 flex-1">
                                {i.product ? (
                                    <Link to={`/produkts/${i.product.id}`} className="font-semibold hover:text-brand-600">
                                        {i.product.name}
                                    </Link>
                                ) : (
                                    '—'
                                )}
                                <span className="block text-ink/60">
                                    {i.quantity} × {eur(i.cena_bridi)}
                                </span>
                            </span>
                            <span className="font-bold">{eur(i.cena_bridi * i.quantity)}</span>
                        </li>
                    ))}
                </ul>

                <dl className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                        <dt>{t('checkout.subtotal')}</dt>
                        <dd>{eur(subtotal)}</dd>
                    </div>
                    {Number(order.discount) > 0 && (
                        <div className="flex justify-between text-brand-600">
                            <dt>{t('checkout.discount')}</dt>
                            <dd>−{eur(order.discount)}</dd>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <dt>{t('checkout.delivery')}</dt>
                        <dd>{Number(order.delivery_fee) === 0 ? t('checkout.free') : eur(order.delivery_fee)}</dd>
                    </div>
                    <div className="flex justify-between pt-1 text-lg font-extrabold">
                        <dt>{t('common.total')}</dt>
                        <dd>{eur(order.total)}</dd>
                    </div>
                </dl>

                {state?.subscriptions > 0 && <p className="mt-4 rounded-xl bg-brand-50 p-3 text-brand-700">🔁 {t('order.subscriptionsCreated', { n: state.subscriptions, days: state.interval })}</p>}
                {order.subscription && <p className="mt-4 rounded-xl bg-brand-50 p-3 text-brand-700">🔁 {t('order.fromSubscription', { days: order.subscription.interval_days })}</p>}

                <div className="mt-6 flex flex-wrap gap-2">
                    <Link to="/profils?tab=pasutijumi" className="btn-ghost">
                        {t('order.history')}
                    </Link>
                    <Link to="/katalogs" className="btn-primary">
                        {t('order.continue')}
                    </Link>
                </div>
            </div>
        </div>
    );
}

/** Profila cilne: pasūtījumu vēsture. */
export function OrdersTab() {
    const { t } = useI18n();
    const [orders, setOrders] = useState([]);
    const [page, setPage] = useState({ current: 0, last: 1 });
    const [loading, setLoading] = useState(true);

    const load = useCallback((p) => {
        setLoading(true);
        api('/orders', { params: { page: p } })
            .then((res) => {
                setOrders((list) => (p === 1 ? res.data : [...list, ...res.data]));
                setPage({ current: res.current_page, last: res.last_page });
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => load(1), [load]);

    if (loading && orders.length === 0) return <Loading />;
    if (orders.length === 0) return <p className="text-ink/60">{t('order.none')}</p>;

    return (
        <div className="space-y-3">
            {orders.map((o) => (
                <Link key={o.id} to={`/pasutijums/${o.id}`} className="card flex flex-wrap items-center gap-x-4 gap-y-2 p-4 hover:border-brand-500">
                    <span className="font-extrabold">#{o.id}</span>
                    <span className="text-sm text-ink/60">{fmtDate(o.created_at)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{o.items.map((i) => i.product?.name).join(', ')}</span>
                    <span className="font-bold">{eur(o.total)}</span>
                    <StatusBadge status={o.status} />
                </Link>
            ))}
            {page.current < page.last && (
                <button className="btn-ghost w-full" disabled={loading} onClick={() => load(page.current + 1)}>
                    {t('common.loadMore')}
                </button>
            )}
        </div>
    );
}

/** Profila cilne: abonementu pārvaldība (apturēt / atsākt / atcelt, intervāls, daudzums). */
export function SubscriptionsTab() {
    const { t } = useI18n();
    const { notify } = useStore();
    const confirm = useConfirm();
    const [subs, setSubs] = useState(null);
    const [edit, setEdit] = useState({});

    const load = useCallback(() => api('/subscriptions').then(setSubs).catch(() => setSubs([])), []);
    useEffect(() => {
        load();
    }, [load]);

    const update = async (sub, body, message) => {
        try {
            await api(`/subscriptions/${sub.id}`, { method: 'PUT', body });
            notify(message);
            setEdit((e) => ({ ...e, [sub.id]: undefined }));
            load();
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    const save = (sub) => {
        const values = edit[sub.id];
        const errs = validate(values, { quantity: [required, integer, between(1, sub.product?.stock || 999)], interval_days: [required, integer, between(7, 90, 'val.interval')] });
        if (Object.keys(errs).length) return notify(Object.values(errs)[0], 'error');
        update(sub, { quantity: Number(values.quantity), interval_days: Number(values.interval_days) }, t('subs.saved'));
    };

    const cancel = async (sub) => {
        if (await confirm({ title: t('subs.cancelConfirm'), text: t('subs.cancelText'), confirmLabel: t('subs.cancel') })) update(sub, { status: 'atcelts' }, t('subs.cancelled'));
    };

    if (!subs) return <Loading />;
    if (subs.length === 0) return <p className="text-ink/60">{t('subs.none')}</p>;

    return (
        <div className="space-y-3">
            {subs.map((s) => {
                const e = edit[s.id];
                const active = s.status !== 'atcelts';
                return (
                    <div key={s.id} className={`card p-4 ${active ? '' : 'opacity-60'}`}>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-50 text-2xl">{s.product && <ProductImage product={s.product} />}</span>
                            <div className="min-w-0 flex-1 basis-48">
                                <Link to={`/produkts/${s.product_id}`} className="font-bold hover:text-brand-600">
                                    {s.product?.name}
                                </Link>
                                <p className="text-sm text-ink/60">
                                    {t('subs.line', { q: s.quantity, days: s.interval_days })} · {s.status === 'aktīvs' ? t('subs.next', { date: fmtDate(s.next_delivery_date) }) : t('subs.noDelivery')}
                                </p>
                                <p className="truncate text-xs text-ink/50">{s.address}</p>
                            </div>
                            <StatusBadge status={s.status} />
                        </div>
                        {active && (
                            <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-black/5 pt-3">
                                {e ? (
                                    <>
                                        <label className="text-sm">
                                            <span className="label">{t('attr.quantity')}</span>
                                            <input className="input w-24" type="number" min={1} value={e.quantity} onChange={(ev) => setEdit({ ...edit, [s.id]: { ...e, quantity: ev.target.value } })} />
                                        </label>
                                        <label className="text-sm">
                                            <span className="label">{t('subs.intervalDays')}</span>
                                            <input className="input w-24" type="number" min={7} max={90} value={e.interval_days} onChange={(ev) => setEdit({ ...edit, [s.id]: { ...e, interval_days: ev.target.value } })} />
                                        </label>
                                        <button className="btn-primary px-3 py-2 text-sm" onClick={() => save(s)}>
                                            {t('common.save')}
                                        </button>
                                        <button className="btn-ghost px-3 py-2 text-sm" onClick={() => setEdit({ ...edit, [s.id]: undefined })}>
                                            {t('common.cancel')}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button className="btn-ghost px-3 py-2 text-sm" onClick={() => setEdit({ ...edit, [s.id]: { quantity: s.quantity, interval_days: s.interval_days } })}>
                                            ✏️ {t('subs.change')}
                                        </button>
                                        {s.status === 'aktīvs' ? (
                                            <button className="btn-ghost px-3 py-2 text-sm" onClick={() => update(s, { status: 'apturēts' }, t('subs.paused'))}>
                                                ⏸ {t('subs.pause')}
                                            </button>
                                        ) : (
                                            <button className="btn-ghost px-3 py-2 text-sm" onClick={() => update(s, { status: 'aktīvs' }, t('subs.resumed'))}>
                                                ▶ {t('subs.resume')}
                                            </button>
                                        )}
                                        <button className="btn-ghost px-3 py-2 text-sm text-red-600" onClick={() => cancel(s)}>
                                            {t('subs.cancel')}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

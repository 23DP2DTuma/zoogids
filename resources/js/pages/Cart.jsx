import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useConfirm } from '../components/ConfirmDialog';
import { Field, Modal } from '../components/Modal';
import { ProductImage } from '../components/ProductCard';
import { useI18n } from '../lang';
import { api, eur, fieldErrors } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useStore } from '../lib/store';
import { between, max, required, validate } from '../lib/validate';

const FREE_FROM = 35;
const FEES = { pakomāts: 2.99, kurjers: 5.99 };

export default function Cart() {
    const { t } = useI18n();
    const { user } = useAuth();
    const { cart, cartTotal, setQty, removeFromCart, clearCart, notify } = useStore();
    const confirm = useConfirm();
    const navigate = useNavigate();
    const [lockers, setLockers] = useState([]);
    const [form, setForm] = useState({ delivery_type: 'pakomāts', locker_id: '', address: '', subscribe: false, interval_days: 30 });
    const [errors, setErrors] = useState({});
    const [paying, setPaying] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        api('/lockers').then(setLockers).catch(() => {});
    }, []);

    const fee = cartTotal >= FREE_FROM ? 0 : FEES[form.delivery_type];
    const discount = form.subscribe ? Math.round(cartTotal * 10) / 100 : 0;
    const total = cartTotal - discount + fee;
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

    const toPayment = (e) => {
        e.preventDefault();
        const rules = form.delivery_type === 'pakomāts' ? { locker_id: [required] } : { address: [required, max(255)] };
        if (form.subscribe) rules.interval_days = [required, between(7, 90, 'val.interval')];
        const errs = validate(form, rules);
        setErrors(errs);
        if (Object.keys(errs).length) return notify(t('common.checkForm'), 'error');
        setPaying(true);
    };

    const pay = async () => {
        setBusy(true);
        try {
            const body = { delivery_type: form.delivery_type, subscribe: form.subscribe };
            if (form.delivery_type === 'pakomāts') body.locker_id = form.locker_id;
            else body.address = form.address;
            if (form.subscribe) body.interval_days = Number(form.interval_days);
            const order = await api('/orders', { method: 'POST', body });
            clearCart();
            notify(t('checkout.success', { id: order.id }));
            navigate(`/pasutijums/${order.id}`, { state: { justPlaced: true, subscriptions: order.subscriptions_created, interval: order.interval_days } });
        } catch (err) {
            setErrors(fieldErrors(err));
            notify(err.message, 'error');
            setPaying(false);
        } finally {
            setBusy(false);
        }
    };

    const remove = async (product) => {
        if (await confirm({ title: t('cart.removeConfirm', { name: product.name }), text: '', confirmLabel: t('cart.remove') })) removeFromCart(product.id);
    };

    if (cart.length === 0)
        return (
            <div className="card mx-auto max-w-lg p-10 text-center">
                <div className="text-6xl">🛒</div>
                <p className="mt-3 font-semibold">{t('cart.empty')}</p>
                <Link to="/katalogs" className="btn-primary mt-5">
                    {t('cart.toCatalog')}
                </Link>
            </div>
        );

    const cities = [...new Set(lockers.map((l) => l.city))];

    return (
        <div>
            <h1 className="text-3xl font-extrabold">{t('cart.title')}</h1>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
                <div className="space-y-3">
                    {cart.map(({ product, quantity }) => (
                        <div key={product.id} className="card flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap sm:gap-4">
                            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-50 text-3xl">
                                <ProductImage product={product} />
                            </span>
                            <div className="min-w-0 flex-1 basis-40">
                                <Link to={`/produkts/${product.id}`} className="font-bold break-words hover:text-brand-600">
                                    {product.name}
                                </Link>
                                <p className="text-sm text-ink/60">
                                    {eur(product.price)} / {t('common.pcs')}
                                </p>
                            </div>
                            <div className="flex items-center rounded-xl border border-black/10">
                                <button className="px-3 py-1.5" onClick={() => setQty(product.id, quantity - 1)} disabled={quantity <= 1} aria-label={t('cart.decrease')}>
                                    −
                                </button>
                                <span className="w-8 text-center font-semibold" aria-live="polite">
                                    {quantity}
                                </span>
                                <button className="px-3 py-1.5" onClick={() => setQty(product.id, quantity + 1)} disabled={quantity >= product.stock} aria-label={t('cart.increase')}>
                                    +
                                </button>
                            </div>
                            <span className="w-20 text-right font-bold">{eur(product.price * quantity)}</span>
                            <button className="rounded-lg px-2 py-1 text-red-600 hover:bg-red-50" onClick={() => remove(product)} aria-label={t('cart.remove')}>
                                ✕
                            </button>
                        </div>
                    ))}
                </div>

                {!user ? (
                    <div className="card h-fit space-y-3 p-5 text-center">
                        <p className="text-lg font-extrabold">
                            {t('common.total')}: {eur(cartTotal)}
                        </p>
                        <p className="text-sm text-ink/70">{t('cart.guestCheckout')}</p>
                        <Link to="/pieslegties?next=/grozs" className="btn-primary w-full">
                            {t('auth.login')}
                        </Link>
                        <Link to="/registreties?next=/grozs" className="btn-ghost w-full">
                            {t('auth.register')}
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={toPayment} noValidate className="card h-fit space-y-3 p-5">
                        <h2 className="text-lg font-extrabold">{t('checkout.title')}</h2>
                        <p className="text-sm text-ink/60">
                            {user.name} {user.last_name} · {user.email}
                        </p>
                        <fieldset>
                            <legend className="label">{t('attr.delivery_type')} *</legend>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    ['pakomāts', `📦 ${t('checkout.locker')}`],
                                    ['kurjers', `🚚 ${t('checkout.courier')}`],
                                ].map(([v, l]) => (
                                    <label key={v} className={`cursor-pointer rounded-xl border p-3 text-center font-semibold focus-within:ring-2 focus-within:ring-brand-100 ${form.delivery_type === v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-black/10'}`}>
                                        <input type="radio" name="delivery_type" className="sr-only" checked={form.delivery_type === v} onChange={() => setForm((f) => ({ ...f, delivery_type: v }))} />
                                        {l}
                                        <span className="block text-xs font-normal text-ink/60">{cartTotal >= FREE_FROM ? t('checkout.free') : eur(FEES[v])}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        {form.delivery_type === 'pakomāts' ? (
                            <Field label={`${t('attr.locker_id')} *`} error={errors.locker_id}>
                                <select className="input" value={form.locker_id} onChange={set('locker_id')}>
                                    <option value="">{t('checkout.chooseLocker')}</option>
                                    {cities.map((c) => (
                                        <optgroup key={c} label={c}>
                                            {lockers
                                                .filter((l) => l.city === c)
                                                .map((l) => (
                                                    <option key={l.id} value={l.id}>
                                                        {l.provider} · {l.name}, {l.address}
                                                    </option>
                                                ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </Field>
                        ) : (
                            <Field label={`${t('attr.address')} *`} error={errors.address}>
                                <input className="input" maxLength={255} autoComplete="street-address" placeholder="Brīvības iela 10, Rīga, LV-1010" value={form.address} onChange={set('address')} />
                            </Field>
                        )}

                        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-brand-50 p-3">
                            <input type="checkbox" className="mt-1 accent-brand-500" checked={form.subscribe} onChange={set('subscribe')} />
                            <span>
                                <b>🔁 {t('checkout.subscribe')}</b>
                                <span className="block text-sm text-ink/70">{t('checkout.subscribeText')}</span>
                            </span>
                        </label>
                        {form.subscribe && (
                            <Field label={t('checkout.interval', { n: form.interval_days })} error={errors.interval_days}>
                                <input type="range" min={7} max={90} value={form.interval_days} onChange={set('interval_days')} className="w-full accent-brand-500" />
                            </Field>
                        )}

                        <dl className="space-y-1 border-t border-black/5 pt-3 text-sm">
                            <div className="flex justify-between">
                                <dt>{t('checkout.subtotal')}</dt>
                                <dd>{eur(cartTotal)}</dd>
                            </div>
                            {form.subscribe && (
                                <div className="flex justify-between text-brand-600">
                                    <dt>{t('checkout.discount')}</dt>
                                    <dd>−{eur(discount)}</dd>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <dt>{t('checkout.delivery')}</dt>
                                <dd>{fee === 0 ? t('checkout.free') : eur(fee)}</dd>
                            </div>
                            <div className="flex justify-between pt-1 text-lg font-extrabold">
                                <dt>{t('common.total')}</dt>
                                <dd>{eur(total)}</dd>
                            </div>
                            {cartTotal < FREE_FROM && <p className="text-xs text-ink/50">{t('checkout.freeFrom')}</p>}
                        </dl>
                        {errors.items && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{errors.items}</p>}
                        <button className="btn-primary w-full">{t('checkout.toPayment')}</button>
                    </form>
                )}
            </div>

            {paying && (
                <Modal title={`💳 ${t('checkout.payTitle')}`} onClose={() => !busy && setPaying(false)} size="max-w-md">
                    <p className="text-sm text-ink/70">{t('checkout.payMock')}</p>
                    <div className="mt-4 rounded-xl bg-brand-50 p-4 text-center">
                        <p className="text-sm text-ink/60">{t('checkout.toPay')}</p>
                        <p className="text-3xl font-extrabold">{eur(total)}</p>
                    </div>
                    <div className="mt-5 flex flex-wrap justify-end gap-2">
                        <button className="btn-ghost" disabled={busy} onClick={() => setPaying(false)}>
                            {t('common.cancel')}
                        </button>
                        <button className="btn-primary" disabled={busy} onClick={pay}>
                            {busy ? t('checkout.processing') : t('checkout.pay', { sum: eur(total) })}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

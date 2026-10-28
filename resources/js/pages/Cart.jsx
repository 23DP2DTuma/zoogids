import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, eur } from '../lib/api';
import { useStore } from '../lib/store';

export default function Cart() {
    const { cart, cartTotal, setQty, removeFromCart, clearCart, notify } = useStore();
    const [form, setForm] = useState({ customer_name: '', email: '', delivery_type: 'pakomāts', address: '' });
    const [subscribe, setSubscribe] = useState(false);
    const [interval, setSubInterval] = useState(30);
    const [sending, setSending] = useState(false);
    const [order, setOrder] = useState(null);

    const total = subscribe ? cartTotal * 0.9 : cartTotal;
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            const res = await api('/orders', {
                method: 'POST',
                body: {
                    ...form,
                    subscription_interval: subscribe ? Number(interval) : null,
                    items: cart.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
                },
            });
            setOrder(res);
            clearCart();
            notify('Pasūtījums noformēts!');
        } catch (err) {
            notify(err.message, 'error');
        } finally {
            setSending(false);
        }
    };

    if (order)
        return (
            <div className="card mx-auto max-w-lg p-8 text-center">
                <div className="text-6xl">🎉</div>
                <h1 className="mt-3 text-2xl font-extrabold">Paldies! Pasūtījums Nr. {order.id}</h1>
                <ul className="mt-4 space-y-1 text-left text-sm">
                    {order.items.map((i) => (
                        <li key={i.id} className="flex justify-between">
                            <span>
                                {i.product.image} {i.product.name} × {i.quantity}
                            </span>
                            <span>{eur(i.cena_bridi * i.quantity)}</span>
                        </li>
                    ))}
                </ul>
                <p className="mt-4 text-lg font-extrabold">Kopā: {eur(order.total)}</p>
                {order.subscription_interval && <p className="mt-2 text-brand-700">🔁 Abonements: ik pēc {order.subscription_interval} dienām</p>}
                <p className="mt-2 text-sm text-ink/60">Piegāde ({order.delivery_type}) 1–2 darba dienās.</p>
                <Link to="/katalogs" className="btn-primary mt-6">
                    Turpināt iepirkties
                </Link>
            </div>
        );

    if (cart.length === 0)
        return (
            <div className="card mx-auto max-w-lg p-10 text-center">
                <div className="text-6xl">🛒</div>
                <p className="mt-3 font-semibold">Grozs ir tukšs.</p>
                <Link to="/katalogs" className="btn-primary mt-5">
                    Uz katalogu
                </Link>
            </div>
        );

    return (
        <div>
            <h1 className="text-3xl font-extrabold">Grozs</h1>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
                <div className="space-y-3">
                    {cart.map(({ product, quantity }) => (
                        <div key={product.id} className="card flex items-center gap-4 p-4">
                            <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-brand-50 text-3xl">{product.image}</span>
                            <div className="min-w-0 flex-1">
                                <Link to={`/produkts/${product.id}`} className="font-bold hover:text-brand-600">
                                    {product.name}
                                </Link>
                                <p className="text-sm text-ink/60">{eur(product.price)} / gab.</p>
                            </div>
                            <div className="flex items-center rounded-xl border border-black/10">
                                <button className="px-3 py-1.5" onClick={() => setQty(product.id, quantity - 1)}>
                                    −
                                </button>
                                <span className="w-8 text-center font-semibold">{quantity}</span>
                                <button className="px-3 py-1.5" onClick={() => setQty(product.id, quantity + 1)}>
                                    +
                                </button>
                            </div>
                            <span className="hidden w-20 text-right font-bold sm:block">{eur(product.price * quantity)}</span>
                            <button className="text-red-600" onClick={() => removeFromCart(product.id)} aria-label="Noņemt">
                                ✕
                            </button>
                        </div>
                    ))}
                </div>

                <form onSubmit={submit} className="card h-fit space-y-3 p-5">
                    <h2 className="text-lg font-extrabold">Pasūtījuma noformēšana</h2>
                    <input required maxLength={60} className="input" placeholder="Vārds, uzvārds" value={form.customer_name} onChange={set('customer_name')} />
                    <input required type="email" maxLength={50} className="input" placeholder="E-pasts" value={form.email} onChange={set('email')} />
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            ['pakomāts', '📦 Pakomāts'],
                            ['kurjers', '🚚 Kurjers'],
                        ].map(([v, l]) => (
                            <label key={v} className={`cursor-pointer rounded-xl border p-3 text-center font-semibold ${form.delivery_type === v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-black/10'}`}>
                                <input type="radio" className="sr-only" checked={form.delivery_type === v} onChange={() => setForm((f) => ({ ...f, delivery_type: v }))} />
                                {l}
                            </label>
                        ))}
                    </div>
                    <input required maxLength={255} className="input" placeholder={form.delivery_type === 'pakomāts' ? 'Pakomāta adrese' : 'Brīvības iela 10, Rīga, LV-1010'} value={form.address} onChange={set('address')} />

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-brand-50 p-3">
                        <input type="checkbox" className="mt-1 accent-brand-500" checked={subscribe} onChange={(e) => setSubscribe(e.target.checked)} />
                        <span>
                            <b>🔁 Abonements −10 %</b>
                            <span className="block text-sm text-ink/70">Atkārtot piegādi automātiski. Var apturēt jebkurā brīdī.</span>
                        </span>
                    </label>
                    {subscribe && (
                        <div>
                            <label className="label">Intervāls: ik pēc {interval} dienām</label>
                            <input type="range" min={7} max={90} value={interval} onChange={(e) => setSubInterval(e.target.value)} className="w-full accent-brand-500" />
                        </div>
                    )}

                    <div className="space-y-1 border-t border-black/5 pt-3 text-sm">
                        <div className="flex justify-between">
                            <span>Starpsumma</span>
                            <span>{eur(cartTotal)}</span>
                        </div>
                        {subscribe && (
                            <div className="flex justify-between text-brand-600">
                                <span>Abonementa atlaide</span>
                                <span>−{eur(cartTotal * 0.1)}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span>Piegāde</span>
                            <span>{cartTotal >= 35 ? 'bezmaksas' : eur(form.delivery_type === 'pakomāts' ? 2.99 : 5.99)}</span>
                        </div>
                        <div className="flex justify-between pt-1 text-lg font-extrabold">
                            <span>Kopā</span>
                            <span>{eur(total + (cartTotal >= 35 ? 0 : form.delivery_type === 'pakomāts' ? 2.99 : 5.99))}</span>
                        </div>
                        {cartTotal < 35 && <p className="text-xs text-ink/50">Bezmaksas piegāde no 35 €</p>}
                    </div>
                    <button className="btn-primary w-full" disabled={sending}>
                        {sending ? 'Sūta…' : 'Noformēt pasūtījumu'}
                    </button>
                </form>
            </div>
        </div>
    );
}

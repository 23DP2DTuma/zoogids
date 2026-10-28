import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Loading } from '../../components/Guards';
import { ProductImage } from '../../components/ProductCard';
import StatusBadge from '../../components/StatusBadge';
import { useI18n } from '../../lang';
import { api, eur } from '../../lib/api';
import { ORDER_STATUSES } from '../../lib/status';

const NAV = [
    ['', '📊', 'admin.dashboard'],
    ['produkti', '📦', 'admin.products'],
    ['kategorijas', '🗂️', 'admin.categories'],
    ['zimoli', '🏷️', 'admin.brands'],
    ['problemas', '🩺', 'admin.problems'],
    ['raksti', '📚', 'admin.articles'],
    ['pasutijumi', '🧾', 'admin.orders'],
    ['abonementi', '🔁', 'admin.subscriptions'],
    ['atsauksmes', '⭐', 'admin.reviews'],
    ['lietotaji', '👥', 'admin.users'],
];

export default function AdminLayout() {
    const { t } = useI18n();
    return (
        <div>
            <h1 className="text-3xl font-extrabold">⚙️ {t('nav.admin')}</h1>
            <div className="mt-5 grid gap-6 lg:grid-cols-[210px_1fr]">
                <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0" aria-label={t('nav.admin')}>
                    {NAV.map(([to, icon, label]) => (
                        <NavLink key={to} to={`/admin${to ? `/${to}` : ''}`} end={!to} className={({ isActive }) => `shrink-0 rounded-xl px-3 py-2 text-sm font-semibold ${isActive ? 'bg-brand-500 text-white' : 'hover:bg-black/5'}`}>
                            <span aria-hidden>{icon}</span> {t(label)}
                        </NavLink>
                    ))}
                </nav>
                <section className="min-w-0">
                    <Outlet />
                </section>
            </div>
        </div>
    );
}

function Tile({ label, value, hint }) {
    return (
        <div className="card p-4">
            <p className="text-sm font-semibold text-ink/60">{label}</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">{value}</p>
            {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
        </div>
    );
}

/** Pārdošanas statistika: pasūtījumu skaits, ieņēmumi, populārākie produkti. */
export function AdminDashboard() {
    const { t } = useI18n();
    const [s, setS] = useState(null);

    useEffect(() => {
        api('/admin/dashboard').then(setS).catch(() => {});
    }, []);

    if (!s) return <Loading />;
    const totalOrders = ORDER_STATUSES.reduce((sum, k) => sum + s.by_status[k], 0) || 1;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <Tile label={t('admin.statOrders')} value={s.orders} hint={t('admin.statOrdersHint')} />
                <Tile label={t('admin.statRevenue')} value={eur(s.revenue)} hint={t('admin.statRevenue30', { sum: eur(s.revenue_30d) })} />
                <Tile label={t('admin.statAverage')} value={eur(s.average_order)} />
                <Tile label={t('admin.statSubs')} value={s.active_subscriptions} hint={t('admin.statUsers', { n: s.users })} />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <div className="card overflow-x-auto p-4">
                    <h2 className="font-extrabold">{t('admin.topProducts')}</h2>
                    <table className="mt-3 w-full text-sm">
                        <thead className="text-left text-xs text-ink/50 uppercase">
                            <tr>
                                <th className="py-2">{t('admin.product')}</th>
                                <th className="py-2 text-right">{t('admin.sold')}</th>
                                <th className="py-2 text-right">{t('admin.revenue')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {s.top_products.map((r) => (
                                <tr key={r.product.id}>
                                    <td className="py-2">
                                        <Link to={`/produkts/${r.product.id}`} className="flex items-center gap-2 hover:text-brand-600">
                                            <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-50">
                                                <ProductImage product={r.product} />
                                            </span>
                                            <span className="line-clamp-1">{r.product.name}</span>
                                        </Link>
                                    </td>
                                    <td className="py-2 text-right tabular-nums">{r.sold}</td>
                                    <td className="py-2 text-right tabular-nums">{eur(r.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="card p-4">
                    <h2 className="font-extrabold">{t('admin.byStatus')}</h2>
                    <ul className="mt-3 space-y-2 text-sm">
                        {ORDER_STATUSES.map((k) => (
                            <li key={k} className="flex items-center justify-between gap-2">
                                <StatusBadge status={k} />
                                <span className="tabular-nums">
                                    <b>{s.by_status[k]}</b> <span className="text-ink/50">({Math.round((s.by_status[k] / totalOrders) * 100)} %)</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                    <Link to="/admin/pasutijumi" className="mt-4 inline-block text-sm font-semibold text-brand-600">
                        {t('admin.allOrders')} →
                    </Link>
                </div>

                <div className="card p-4">
                    <h2 className="font-extrabold">{t('admin.lowStock')}</h2>
                    <ul className="mt-3 space-y-2 text-sm">
                        {s.low_stock.map((p) => (
                            <li key={p.id} className="flex justify-between gap-2">
                                <span className="line-clamp-1">{p.name}</span>
                                <b className={p.stock === 0 ? 'text-red-600' : ''}>
                                    {p.stock} {t('common.pcs')}
                                </b>
                            </li>
                        ))}
                        {s.low_stock.length === 0 && <li className="text-ink/60">{t('admin.stockOk')}</li>}
                    </ul>
                </div>

                <div className="card p-4">
                    <h2 className="font-extrabold">{t('admin.moderation')}</h2>
                    <p className="mt-2 text-sm text-ink/70">{t('admin.hiddenReviews', { n: s.hidden_reviews })}</p>
                    <Link to="/admin/atsauksmes" className="mt-3 inline-block text-sm font-semibold text-brand-600">
                        {t('admin.reviews')} →
                    </Link>
                </div>
            </div>
        </div>
    );
}

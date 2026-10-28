import { Link } from 'react-router-dom';
import CrudPage from '../../components/admin/CrudPage';
import { useConfirm } from '../../components/ConfirmDialog';
import { Field } from '../../components/Modal';
import { StatusSelect } from '../../components/StatusBadge';
import { useI18n } from '../../lang';
import { api, eur, fmtDate } from '../../lib/api';
import { ORDER_STATUSES, SUB_STATUSES } from '../../lib/status';
import { useStore } from '../../lib/store';
import { confirmed, email, max, password, required } from '../../lib/validate';
import { Stars } from '../Product';
import { USER_RULES } from '../Register';

/** Statusa maiņa tieši tabulā (ar apstiprinājumu atcelšanai). */
function useStatusChange(endpoint) {
    const { t } = useI18n();
    const { notify } = useStore();
    const confirm = useConfirm();
    return async (row, status, replace) => {
        if (status === row.status) return;
        if (status === 'atcelts' && !(await confirm({ title: t('admin.cancelConfirm'), text: t('admin.cancelText'), confirmLabel: t('status.atcelts') }))) return;
        try {
            const updated = await api(`${endpoint}/${row.id}`, { method: 'PUT', body: { status } });
            replace({ ...row, status: updated.status, next_delivery_date: updated.next_delivery_date ?? row.next_delivery_date });
            notify(t('admin.statusChanged', { status: t(`status.${status}`) }));
        } catch (err) {
            notify(err.message, 'error');
        }
    };
}

export function OrdersAdmin() {
    const { t } = useI18n();
    const change = useStatusChange('/admin/orders');
    return (
        <CrudPage
            endpoint="/admin/orders"
            title={t('admin.orders')}
            canCreate={false}
            canEdit={false}
            canDelete={false}
            filters={[{ key: 'status', label: t('common.status'), options: ORDER_STATUSES.map((s) => [s, t(`status.${s}`)]) }]}
            columns={[
                {
                    label: 'Nr.',
                    render: (o) => (
                        <Link to={`/pasutijums/${o.id}`} className="font-extrabold text-brand-700 hover:underline">
                            #{o.id}
                        </Link>
                    ),
                },
                { label: t('common.date'), className: 'whitespace-nowrap', render: (o) => fmtDate(o.created_at) },
                {
                    label: t('admin.customer'),
                    render: (o) => (
                        <span>
                            <b>{o.customer_name}</b>
                            <span className="block text-xs text-ink/50">{o.email}</span>
                            {!o.user_id && <span className="block text-xs text-amber-700">{t('admin.deletedUser')}</span>}
                        </span>
                    ),
                },
                { label: t('admin.items'), render: (o) => <span className="line-clamp-2 text-xs">{o.items.map((i) => `${i.product?.name} × ${i.quantity}`).join(', ')}</span> },
                { label: t('attr.delivery_type'), render: (o) => t(o.delivery_type === 'pakomāts' ? 'checkout.locker' : 'checkout.courier') },
                { label: t('common.total'), className: 'text-right whitespace-nowrap font-bold', render: (o) => eur(o.total) },
                { label: t('common.status'), render: (o, { replace }) => <StatusSelect value={o.status} disabled={o.status === 'atcelts'} onChange={(s) => change(o, s, replace)} label={t('admin.statusOf', { id: o.id })} /> },
            ]}
        />
    );
}

export function SubscriptionsAdmin() {
    const { t } = useI18n();
    const change = useStatusChange('/admin/subscriptions');
    return (
        <CrudPage
            endpoint="/admin/subscriptions"
            title={t('admin.subscriptions')}
            canCreate={false}
            canEdit={false}
            canDelete={false}
            filters={[{ key: 'status', label: t('common.status'), options: SUB_STATUSES.map((s) => [s, t(`status.${s}`)]) }]}
            columns={[
                { label: 'Nr.', render: (s) => <b>#{s.id}</b> },
                {
                    label: t('admin.customer'),
                    render: (s) => (
                        <span>
                            <b>
                                {s.user?.name} {s.user?.last_name}
                            </b>
                            <span className="block text-xs text-ink/50">{s.user?.email}</span>
                        </span>
                    ),
                },
                { label: t('admin.product'), render: (s) => <span className="line-clamp-2">{s.product?.name}</span> },
                { label: t('admin.subLine'), className: 'whitespace-nowrap', render: (s) => t('subs.line', { q: s.quantity, days: s.interval_days }) },
                { label: t('admin.nextDelivery'), className: 'whitespace-nowrap', render: (s) => fmtDate(s.next_delivery_date) },
                { label: t('common.status'), render: (s, { replace }) => <StatusSelect kind="subscription" value={s.status} disabled={s.status === 'atcelts'} onChange={(v) => change(s, v, replace)} /> },
            ]}
        />
    );
}

export function ReviewsAdmin() {
    const { t } = useI18n();
    const { notify } = useStore();

    const toggle = async (r, replace) => {
        try {
            replace(await api(`/admin/reviews/${r.id}`, { method: 'PUT', body: { is_visible: !r.is_visible } }));
            notify(r.is_visible ? t('admin.reviewHidden') : t('admin.reviewShown'));
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    return (
        <CrudPage
            endpoint="/admin/reviews"
            title={t('admin.reviews')}
            canCreate={false}
            canEdit={false}
            filters={[
                {
                    key: 'visible',
                    label: t('admin.visibility'),
                    options: [
                        ['1', t('reviews.visible')],
                        ['0', t('reviews.hidden')],
                    ],
                },
            ]}
            columns={[
                { label: t('common.date'), className: 'whitespace-nowrap', render: (r) => fmtDate(r.created_at) },
                {
                    label: t('admin.product'),
                    render: (r) => (
                        <Link to={`/produkts/${r.product_id}`} className="line-clamp-2 font-semibold hover:text-brand-600">
                            {r.product?.name}
                        </Link>
                    ),
                },
                { label: t('admin.customer'), render: (r) => `${r.user?.name || ''} ${r.user?.last_name || ''}` },
                {
                    label: t('attr.comment'),
                    render: (r) => (
                        <span>
                            <Stars value={r.rating} />
                            <span className="line-clamp-3 block text-xs text-ink/70">{r.comment}</span>
                        </span>
                    ),
                },
                {
                    label: t('admin.visibility'),
                    render: (r, { replace }) => (
                        <button onClick={() => toggle(r, replace)} className={`chip whitespace-nowrap ${r.is_visible ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`} aria-pressed={!r.is_visible} title={r.is_visible ? t('admin.hide') : t('admin.show')}>
                            {r.is_visible ? `👁 ${t('reviews.visible')}` : `🚫 ${t('reviews.hidden')}`}
                        </button>
                    ),
                },
            ]}
            deleteTitle={() => t('reviews.deleteConfirm')}
        />
    );
}

export function UsersAdmin() {
    const { t } = useI18n();
    return (
        <CrudPage
            endpoint="/admin/users"
            title={t('admin.users')}
            newLabel={t('admin.newUser')}
            filters={[
                {
                    key: 'role',
                    label: t('attr.role'),
                    options: [
                        ['user', t('admin.roles.user')],
                        ['admin', t('admin.roles.admin')],
                    ],
                },
            ]}
            columns={[
                {
                    label: t('admin.user'),
                    render: (u) => (
                        <span>
                            <b>
                                {u.name} {u.last_name}
                            </b>
                            <span className="block text-xs text-ink/50">{u.email}</span>
                        </span>
                    ),
                },
                { label: t('attr.role'), render: (u) => <span className={`chip ${u.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-black/5'}`}>{t(`admin.roles.${u.role}`)}</span> },
                { label: t('admin.registered'), className: 'whitespace-nowrap', render: (u) => fmtDate(u.created_at) },
                { label: t('admin.ordersCount'), className: 'text-right', render: (u) => u.orders_count },
                { label: t('admin.petsCount'), className: 'text-right', render: (u) => u.pets_count },
            ]}
            empty={{ name: '', last_name: '', email: '', role: 'user', password: '', password_confirmation: '' }}
            toForm={(u) => ({ name: u.name, last_name: u.last_name || '', email: u.email, role: u.role, password: '', password_confirmation: '' })}
            rules={(f) => ({ ...USER_RULES, email: [required, email, max(50)], password: f.id ? [password, confirmed] : [required, password, confirmed] })}
            toBody={(f) => {
                const body = { name: f.name, last_name: f.last_name, email: f.email, role: f.role };
                if (f.password) Object.assign(body, { password: f.password, password_confirmation: f.password_confirmation });
                return body;
            }}
            deleteTitle={(u) => t('admin.deleteUser', { name: `${u.name} ${u.last_name || ''}` })}
            renderForm={(f, set, errors) => (
                <>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label={`${t('attr.name')} *`} error={errors.name}>
                            <input className="input" maxLength={30} value={f.name} onChange={set('name')} />
                        </Field>
                        <Field label={`${t('attr.last_name')} *`} error={errors.last_name}>
                            <input className="input" maxLength={30} value={f.last_name} onChange={set('last_name')} />
                        </Field>
                    </div>
                    <Field label={`${t('attr.email')} *`} error={errors.email}>
                        <input className="input" type="email" maxLength={50} value={f.email} onChange={set('email')} />
                    </Field>
                    <Field label={`${t('attr.role')} *`} error={errors.role}>
                        <select className="input" value={f.role} onChange={set('role')}>
                            <option value="user">{t('admin.roles.user')}</option>
                            <option value="admin">{t('admin.roles.admin')}</option>
                        </select>
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label={`${t('attr.password')}${f.id ? '' : ' *'}`} error={errors.password} hint={f.id ? t('admin.passwordKeep') : t('auth.passwordHint')}>
                            <input className="input" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} />
                        </Field>
                        <Field label={t('attr.password_confirmation')} error={errors.password_confirmation}>
                            <input className="input" type="password" autoComplete="new-password" value={f.password_confirmation} onChange={set('password_confirmation')} />
                        </Field>
                    </div>
                </>
            )}
        />
    );
}

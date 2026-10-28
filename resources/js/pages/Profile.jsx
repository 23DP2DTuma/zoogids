import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useConfirm } from '../components/ConfirmDialog';
import { Field, FormActions, Modal } from '../components/Modal';
import { useI18n } from '../lang';
import { api, fieldErrors } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useStore } from '../lib/store';
import { confirmed, password, required, validate } from '../lib/validate';
import Pets from './Pets';
import { USER_RULES } from './Register';

const TABS = [
    ['dati', 'profile.tabData', ProfileData],
    ['miluli', 'profile.tabPets', () => <Pets embedded />],
];

/** Lietotāja panelis: profila dati, mīluļi, pasūtījumi, abonementi, atsauksmes. */
export default function Profile() {
    const { t } = useI18n();
    const { user } = useAuth();
    const [params, setParams] = useSearchParams();
    const tab = TABS.find(([k]) => k === params.get('tab')) || TABS[0];
    const Component = tab[2];

    return (
        <div>
            <h1 className="text-3xl font-extrabold">
                {t('profile.hello', { name: user.name })} 👋
            </h1>
            <div className="mt-5 -mx-4 flex gap-1 overflow-x-auto px-4 pb-1" role="tablist">
                {TABS.map(([k, label]) => (
                    <button key={k} role="tab" aria-selected={tab[0] === k} onClick={() => setParams({ tab: k })} className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold ${tab[0] === k ? 'bg-brand-500 text-white' : 'border border-black/10 bg-white hover:border-brand-500'}`}>
                        {t(label)}
                    </button>
                ))}
            </div>
            <div className="mt-6">
                <Component />
            </div>
        </div>
    );
}

function ProfileData() {
    const { t } = useI18n();
    const { user, setUser } = useAuth();
    const { notify } = useStore();
    const confirm = useConfirm();
    const navigate = useNavigate();

    const [form, setForm] = useState({ name: user.name, last_name: user.last_name || '', email: user.email });
    const [errors, setErrors] = useState({});
    const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' });
    const [pwErrors, setPwErrors] = useState({});
    const [del, setDel] = useState(null);
    const [busy, setBusy] = useState(false);

    const saveProfile = async (e) => {
        e.preventDefault();
        const errs = validate(form, USER_RULES);
        setErrors(errs);
        if (Object.keys(errs).length) return notify(t('common.checkForm'), 'error');
        setBusy(true);
        try {
            setUser(await api('/user', { method: 'PUT', body: form }));
            notify(t('profile.saved'));
        } catch (err) {
            setErrors(fieldErrors(err));
            notify(err.message, 'error');
        } finally {
            setBusy(false);
        }
    };

    const savePassword = async (e) => {
        e.preventDefault();
        const errs = validate(pw, { current_password: [required], password: [required, password, confirmed] });
        setPwErrors(errs);
        if (Object.keys(errs).length) return notify(t('common.checkForm'), 'error');
        setBusy(true);
        try {
            await api('/user/password', { method: 'PUT', body: pw });
            setPw({ current_password: '', password: '', password_confirmation: '' });
            notify(t('profile.passwordChanged'));
        } catch (err) {
            setPwErrors(fieldErrors(err));
            notify(err.message, 'error');
        } finally {
            setBusy(false);
        }
    };

    const deleteAccount = async (e) => {
        e.preventDefault();
        const errs = validate(del, { password: [required] });
        if (Object.keys(errs).length) return setDel((d) => ({ ...d, errors: errs }));
        if (!(await confirm({ title: t('profile.deleteConfirm') }))) return;
        try {
            await api('/user', { method: 'DELETE', body: { password: del.password } });
            setUser(null);
            notify(t('profile.deleted'));
            navigate('/');
        } catch (err) {
            setDel((d) => ({ ...d, errors: fieldErrors(err) }));
            notify(err.message, 'error');
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={saveProfile} noValidate className="card space-y-4 p-5">
                <h2 className="text-lg font-extrabold">{t('profile.dataTitle')}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={`${t('attr.name')} *`} error={errors.name}>
                        <input className="input" maxLength={30} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </Field>
                    <Field label={`${t('attr.last_name')} *`} error={errors.last_name}>
                        <input className="input" maxLength={30} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                    </Field>
                </div>
                <Field label={`${t('attr.email')} *`} error={errors.email}>
                    <input className="input" type="email" maxLength={50} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </Field>
                <button className="btn-primary" disabled={busy}>
                    {t('common.save')}
                </button>
            </form>

            <form onSubmit={savePassword} noValidate className="card space-y-4 p-5">
                <h2 className="text-lg font-extrabold">{t('profile.passwordTitle')}</h2>
                <Field label={t('attr.current_password')} error={pwErrors.current_password}>
                    <input className="input" type="password" autoComplete="current-password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} />
                </Field>
                <Field label={t('profile.newPassword')} error={pwErrors.password} hint={t('auth.passwordHint')}>
                    <input className="input" type="password" autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} />
                </Field>
                <Field label={t('attr.password_confirmation')} error={pwErrors.password_confirmation}>
                    <input className="input" type="password" autoComplete="new-password" value={pw.password_confirmation} onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })} />
                </Field>
                <button className="btn-primary" disabled={busy}>
                    {t('profile.changePassword')}
                </button>
            </form>

            <div className="card border-red-200 p-5 lg:col-span-2">
                <h2 className="text-lg font-extrabold text-red-700">{t('profile.dangerTitle')}</h2>
                <p className="mt-1 text-sm text-ink/70">{t('profile.deleteText')}</p>
                <button className="btn mt-4 bg-red-600 text-white hover:bg-red-700" onClick={() => setDel({ password: '', errors: {} })}>
                    {t('profile.deleteAccount')}
                </button>
            </div>

            {del && (
                <Modal title={t('profile.deleteAccount')} onClose={() => setDel(null)} size="max-w-md">
                    <form onSubmit={deleteAccount} noValidate className="space-y-4">
                        <p className="text-sm text-ink/70">{t('profile.deletePasswordText')}</p>
                        <Field label={t('attr.password')} error={del.errors.password}>
                            <input className="input" type="password" autoComplete="current-password" value={del.password} onChange={(e) => setDel({ ...del, password: e.target.value })} />
                        </Field>
                        <FormActions onCancel={() => setDel(null)} submitLabel={t('profile.deleteAccount')} />
                    </form>
                </Modal>
            )}
        </div>
    );
}

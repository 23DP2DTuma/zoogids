import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Field } from '../components/Modal';
import { useI18n } from '../lang';
import { fieldErrors } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useStore } from '../lib/store';
import { email, required, validate } from '../lib/validate';

export default function Login() {
    const { t } = useI18n();
    const { login } = useAuth();
    const { notify } = useStore();
    const [params] = useSearchParams();
    const [form, setForm] = useState({ email: '', password: '', remember: true });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        const errs = validate(form, { email: [required, email], password: [required] });
        setErrors(errs);
        if (Object.keys(errs).length) return;
        setBusy(true);
        try {
            const u = await login(form);
            notify(t('auth.welcome', { name: u.name }));
            // Novirzīšanu uz ?next= veic GuestOnly
        } catch (err) {
            setErrors(fieldErrors(err));
            notify(err.message, 'error');
            setBusy(false);
        }
    };

    return (
        <div className="mx-auto max-w-md">
            <form onSubmit={submit} noValidate className="card space-y-4 p-6 sm:p-8">
                <div className="text-center">
                    <div className="text-5xl">🐾</div>
                    <h1 className="mt-2 text-2xl font-extrabold">{t('auth.loginTitle')}</h1>
                    {params.get('next') && <p className="mt-1 text-sm text-ink/60">{t('auth.loginNeeded')}</p>}
                </div>
                <Field label={t('attr.email')} error={errors.email}>
                    <input className="input" type="email" autoComplete="email" maxLength={50} value={form.email} onChange={set('email')} />
                </Field>
                <Field label={t('attr.password')} error={errors.password}>
                    <input className="input" type="password" autoComplete="current-password" value={form.password} onChange={set('password')} />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="accent-brand-500" checked={form.remember} onChange={set('remember')} />
                    {t('auth.remember')}
                </label>
                <button className="btn-primary w-full" disabled={busy}>
                    {busy ? t('common.loading') : t('auth.login')}
                </button>
                <p className="text-center text-sm text-ink/70">
                    {t('auth.noAccount')}{' '}
                    <Link to={`/registreties${params.get('next') ? `?next=${encodeURIComponent(params.get('next'))}` : ''}`} className="font-semibold text-brand-600">
                        {t('auth.register')}
                    </Link>
                </p>
            </form>
        </div>
    );
}

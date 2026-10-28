import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Field } from '../components/Modal';
import { useI18n } from '../lang';
import { fieldErrors } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useStore } from '../lib/store';
import { confirmed, email, max, password, required, validate } from '../lib/validate';

export const USER_RULES = {
    name: [required, max(30)],
    last_name: [required, max(30)],
    email: [required, email, max(50)],
};

export default function Register() {
    const { t } = useI18n();
    const { register } = useAuth();
    const { notify } = useStore();
    const [params] = useSearchParams();
    const [form, setForm] = useState({ name: '', last_name: '', email: '', password: '', password_confirmation: '' });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        const errs = validate(form, { ...USER_RULES, password: [required, password, confirmed] });
        setErrors(errs);
        if (Object.keys(errs).length) {
            notify(t('common.checkForm'), 'error');
            return;
        }
        setBusy(true);
        try {
            await register(form);
            notify(t('auth.registered'));
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
                    <div className="text-5xl">🐶</div>
                    <h1 className="mt-2 text-2xl font-extrabold">{t('auth.registerTitle')}</h1>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={`${t('attr.name')} *`} error={errors.name}>
                        <input className="input" autoComplete="given-name" maxLength={30} value={form.name} onChange={set('name')} />
                    </Field>
                    <Field label={`${t('attr.last_name')} *`} error={errors.last_name}>
                        <input className="input" autoComplete="family-name" maxLength={30} value={form.last_name} onChange={set('last_name')} />
                    </Field>
                </div>
                <Field label={`${t('attr.email')} *`} error={errors.email}>
                    <input className="input" type="email" autoComplete="email" maxLength={50} value={form.email} onChange={set('email')} />
                </Field>
                <Field label={`${t('attr.password')} *`} error={errors.password} hint={t('auth.passwordHint')}>
                    <input className="input" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
                </Field>
                <Field label={`${t('attr.password_confirmation')} *`} error={errors.password_confirmation}>
                    <input className="input" type="password" autoComplete="new-password" value={form.password_confirmation} onChange={set('password_confirmation')} />
                </Field>
                <button className="btn-primary w-full" disabled={busy}>
                    {busy ? t('common.loading') : t('auth.register')}
                </button>
                <p className="text-center text-sm text-ink/70">
                    {t('auth.haveAccount')}{' '}
                    <Link to={`/pieslegties${params.get('next') ? `?next=${encodeURIComponent(params.get('next'))}` : ''}`} className="font-semibold text-brand-600">
                        {t('auth.login')}
                    </Link>
                </p>
            </form>
        </div>
    );
}

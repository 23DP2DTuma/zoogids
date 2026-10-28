import { Link } from 'react-router-dom';
import { useI18n } from '../lang';

export default function NotFound() {
    const { t } = useI18n();
    return (
        <div className="py-20 text-center">
            <div className="text-7xl">🐾</div>
            <p className="mt-4 text-sm font-bold tracking-widest text-ink/40">404</p>
            <h1 className="text-3xl font-extrabold">{t('errors.notFoundTitle')}</h1>
            <p className="mt-2 text-ink/60">{t('errors.notFoundText')}</p>
            <Link to="/" className="btn-primary mt-6">
                {t('errors.home')}
            </Link>
        </div>
    );
}

export function Forbidden() {
    const { t } = useI18n();
    return (
        <div className="py-20 text-center">
            <div className="text-7xl">🔒</div>
            <p className="mt-4 text-sm font-bold tracking-widest text-ink/40">403</p>
            <h1 className="text-3xl font-extrabold">{t('errors.forbiddenTitle')}</h1>
            <p className="mt-2 text-ink/60">{t('errors.forbiddenText')}</p>
            <Link to="/" className="btn-primary mt-6">
                {t('errors.home')}
            </Link>
        </div>
    );
}

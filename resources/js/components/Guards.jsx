import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useI18n } from '../lang';
import { useAuth } from '../lib/auth';

export function Loading() {
    const { t } = useI18n();
    return <p className="py-10 text-center text-ink/60">{t('common.loading')}</p>;
}

/** Ceļš uz pieteikšanos ar atgriešanos atpakaļ pēc tam. */
export const loginPath = (location) => `/pieslegties?next=${encodeURIComponent(location.pathname + location.search)}`;

export function RequireAuth({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) return <Loading />;
    if (!user) return <Navigate to={loginPath(location)} replace />;
    return children ?? <Outlet />;
}

export function RequireAdmin({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) return <Loading />;
    if (!user) return <Navigate to={loginPath(location)} replace />;
    if (user.role !== 'admin') return <Navigate to="/403" replace />;
    return children ?? <Outlet />;
}

/** Tikai viesiem (pieteikšanās / reģistrācija); pēc pieteikšanās — atpakaļ uz ?next= lapu. */
export function GuestOnly({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) return <Loading />;
    if (user) {
        const next = new URLSearchParams(location.search).get('next');
        return <Navigate to={next && next.startsWith('/') && !next.startsWith('//') ? next : '/profils'} replace />;
    }
    return children;
}

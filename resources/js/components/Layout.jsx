import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LANGS, useI18n } from '../lang';
import { fmtDate, SPECIES } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useStore } from '../lib/store';
import { loginPath } from './Guards';

const NAV = [
    ['/katalogs', 'nav.catalog'],
    ['/gudrais-filtrs', 'nav.smartFilter'],
    ['/kalkulators', 'nav.calculator'],
    ['/padomi', 'nav.tips'],
    ['/mani-miluli', 'nav.pets'],
];

/** Globālie API notikumi: 403 → kļūdas lapa, 401 → pieteikšanās ar atgriešanos. */
function useApiEvents() {
    const navigate = useNavigate();
    const location = useLocation();
    const locRef = useRef(location);
    locRef.current = location;

    useEffect(() => {
        const onForbidden = () => navigate('/403', { replace: true });
        const onUnauth = () => navigate(loginPath(locRef.current), { replace: true });
        window.addEventListener('zg:forbidden', onForbidden);
        window.addEventListener('zg:unauthenticated', onUnauth);
        return () => {
            window.removeEventListener('zg:forbidden', onForbidden);
            window.removeEventListener('zg:unauthenticated', onUnauth);
        };
    }, [navigate]);
}

function PetSelect({ className }) {
    const { t } = useI18n();
    const { activePet, pets, setActivePetId } = useStore();
    if (!pets.length) return null;
    return (
        <select aria-label={t('nav.activePet')} value={activePet?.id ?? ''} onChange={(e) => setActivePetId(e.target.value || null)} className={className}>
            <option value="">{t('nav.allAnimals')}</option>
            {pets.map((p) => (
                <option key={p.id} value={p.id}>
                    {SPECIES[p.species]?.icon} {p.name}
                </option>
            ))}
        </select>
    );
}

function LangSelect({ className }) {
    const { lang, setLang, t } = useI18n();
    return (
        <select aria-label={t('nav.language')} value={lang} onChange={(e) => setLang(e.target.value)} className={className}>
            {Object.entries(LANGS).map(([k, l]) => (
                <option key={k} value={k}>
                    {l}
                </option>
            ))}
        </select>
    );
}

function Bell() {
    const { t } = useI18n();
    const { upcoming = [] } = useStore();
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button onClick={() => setOpen(!open)} className="relative rounded-xl border border-black/10 bg-white px-3 py-2" aria-label={t('nav.reminders')} aria-expanded={open}>
                🔔
                {upcoming.length > 0 && <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-red-500 text-xs font-bold text-white">{upcoming.length}</span>}
            </button>
            {open && (
                <div className="card absolute right-0 z-40 mt-2 w-72 max-w-[calc(100vw-2rem)] p-3" onMouseLeave={() => setOpen(false)}>
                    <p className="mb-2 text-sm font-extrabold">{t('reminders.upcomingTitle')}</p>
                    {upcoming.length === 0 && <p className="text-sm text-ink/60">{t('reminders.none')}</p>}
                    <ul className="space-y-2 text-sm">
                        {upcoming.map((r) => (
                            <li key={r.id} className="rounded-lg bg-amber-50 px-3 py-2">
                                <b>{r.pet?.name}</b>: {t(`reminders.types.${r.type}`)} — {fmtDate(r.date)}
                            </li>
                        ))}
                    </ul>
                    <Link to="/profils?tab=miluli" onClick={() => setOpen(false)} className="mt-3 block text-sm font-semibold text-brand-600">
                        {t('reminders.manage')} →
                    </Link>
                </div>
            )}
        </div>
    );
}

function UserMenu() {
    const { t } = useI18n();
    const { user, isAdmin, logout } = useAuth();
    const { notify } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);

    if (!user)
        return (
            <Link to={loginPath(location)} className="btn-primary px-3 py-2 text-sm">
                <span aria-hidden>👤</span> <span className="hidden sm:inline">{t('auth.login')}</span>
            </Link>
        );

    const doLogout = async () => {
        setOpen(false);
        await logout();
        notify(t('auth.loggedOut'));
        navigate('/');
    };

    return (
        <div className="relative">
            <button onClick={() => setOpen(!open)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold" aria-expanded={open} aria-label={t('nav.account')}>
                👤 <span className="hidden max-w-24 truncate align-bottom sm:inline-block">{user.name}</span>
            </button>
            {open && (
                <div className="card absolute right-0 z-40 mt-2 w-52 p-2 text-sm font-semibold" onMouseLeave={() => setOpen(false)}>
                    {[
                        ['/profils', 'nav.profile'],
                        ['/profils?tab=miluli', 'nav.pets'],
                        ['/profils?tab=pasutijumi', 'nav.orders'],
                        ['/profils?tab=abonementi', 'nav.subscriptions'],
                    ].map(([to, k]) => (
                        <Link key={to} to={to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 hover:bg-black/5">
                            {t(k)}
                        </Link>
                    ))}
                    {isAdmin && (
                        <Link to="/admin" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-brand-700 hover:bg-black/5">
                            ⚙️ {t('nav.admin')}
                        </Link>
                    )}
                    <button onClick={doLogout} className="block w-full rounded-lg px-3 py-2 text-left text-red-600 hover:bg-black/5">
                        {t('auth.logout')}
                    </button>
                </div>
            )}
        </div>
    );
}

export default function Layout() {
    const { t } = useI18n();
    const { user } = useAuth();
    const { cartCount, toast } = useStore();
    const [open, setOpen] = useState(false);
    const location = useLocation();
    useApiEvents();

    useEffect(() => setOpen(false), [location.pathname]);

    return (
        <div className="flex min-h-screen flex-col">
            <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
                {t('nav.skip')}
            </a>
            <header className="sticky top-0 z-30 border-b border-black/5 bg-[#fbf8f2]/90 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-3">
                    <Link to="/" className="flex shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight">
                        <span className="grid size-9 place-items-center rounded-xl bg-brand-500 text-lg text-white">🐾</span>
                        <span className="hidden min-[400px]:inline">
                            Zoo<span className="text-brand-600">Gids</span>
                        </span>
                    </Link>

                    <nav className="ml-2 hidden gap-1 xl:flex" aria-label={t('nav.main')}>
                        {NAV.map(([to, label]) => (
                            <NavLink key={to} to={to} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-brand-100 text-brand-700' : 'hover:bg-black/5'}`}>
                                {t(label)}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                        <PetSelect className="hidden max-w-40 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold md:block" />
                        <LangSelect className="hidden rounded-xl border border-black/10 bg-white px-2 py-2 text-sm font-semibold sm:block" />
                        {user && <Bell />}
                        <Link to="/grozs" className="relative rounded-xl border border-black/10 bg-white px-3 py-2 font-semibold" aria-label={t('nav.cart')}>
                            🛒 <span className="hidden sm:inline">{t('nav.cart')}</span>
                            {cartCount > 0 && <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-sun text-xs font-bold">{cartCount}</span>}
                        </Link>
                        <UserMenu />
                        <button className="rounded-xl border border-black/10 bg-white px-3 py-2 xl:hidden" onClick={() => setOpen(!open)} aria-label={t('nav.menu')} aria-expanded={open}>
                            ☰
                        </button>
                    </div>
                </div>
                {open && (
                    <nav className="flex flex-col gap-1 border-t border-black/5 px-4 py-2 xl:hidden" aria-label={t('nav.main')}>
                        {NAV.map(([to, label]) => (
                            <NavLink key={to} to={to} className={({ isActive }) => `rounded-lg px-3 py-2 font-semibold ${isActive ? 'bg-brand-100 text-brand-700' : 'hover:bg-black/5'}`}>
                                {t(label)}
                            </NavLink>
                        ))}
                        <div className="mt-1 grid grid-cols-[1fr_auto] gap-2 pb-1">
                            <PetSelect className="input" />
                            <LangSelect className="input w-20" />
                        </div>
                    </nav>
                )}
            </header>

            <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
                <Outlet />
            </main>

            <footer className="border-t border-black/5 px-4 py-8 text-center text-sm text-ink/60">
                ZooGids · {t('footer.text')} · {new Date().getFullYear()}
            </footer>

            {toast && (
                <div key={toast.key} role="status" aria-live="polite" className={`fixed bottom-5 left-1/2 z-[60] w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl px-5 py-3 font-semibold text-white shadow-lg ${toast.type === 'error' ? 'bg-red-600' : 'bg-ink'}`}>
                    {toast.type === 'error' ? '⚠️ ' : '✅ '}
                    {toast.text}
                </div>
            )}
        </div>
    );
}

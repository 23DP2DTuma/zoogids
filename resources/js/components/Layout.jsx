import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { SPECIES } from '../lib/api';
import { useStore } from '../lib/store';

const NAV = [
    ['/katalogs', 'Katalogs'],
    ['/gudrais-filtrs', 'Gudrais filtrs'],
    ['/kalkulators', 'Barības kalkulators'],
    ['/padomi', 'Padomi'],
    ['/mani-miluli', 'Mani mīluļi'],
];

export default function Layout() {
    const { cartCount, activePet, pets, setActivePetId, toast } = useStore();
    const [open, setOpen] = useState(false);

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-30 border-b border-black/5 bg-[#fbf8f2]/90 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
                    <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
                        <span className="grid size-9 place-items-center rounded-xl bg-brand-500 text-lg text-white">🐾</span>
                        Zoo<span className="-ml-2 text-brand-600">Gids</span>
                    </Link>

                    <nav className="ml-4 hidden gap-1 lg:flex">
                        {NAV.map(([to, label]) => (
                            <NavLink key={to} to={to} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-brand-100 text-brand-700' : 'hover:bg-black/5'}`}>
                                {label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="ml-auto flex items-center gap-2">
                        {pets.length > 0 && (
                            <select
                                aria-label="Aktīvais mīlulis"
                                value={activePet?.id ?? ''}
                                onChange={(e) => setActivePetId(e.target.value || null)}
                                className="hidden rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold sm:block"
                            >
                                <option value="">Visi dzīvnieki</option>
                                {pets.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {SPECIES[p.species].icon} {p.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        <Link to="/grozs" className="relative rounded-xl border border-black/10 bg-white px-3 py-2 font-semibold">
                            🛒 <span className="hidden sm:inline">Grozs</span>
                            {cartCount > 0 && <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-sun text-xs font-bold">{cartCount}</span>}
                        </Link>
                        <button className="rounded-xl border border-black/10 bg-white px-3 py-2 lg:hidden" onClick={() => setOpen(!open)} aria-label="Izvēlne">
                            ☰
                        </button>
                    </div>
                </div>
                {open && (
                    <nav className="flex flex-col gap-1 border-t border-black/5 px-4 py-2 lg:hidden">
                        {NAV.map(([to, label]) => (
                            <NavLink key={to} to={to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-semibold hover:bg-black/5">
                                {label}
                            </NavLink>
                        ))}
                        {pets.length > 0 && (
                            <select value={activePet?.id ?? ''} onChange={(e) => setActivePetId(e.target.value || null)} className="input mt-1">
                                <option value="">Visi dzīvnieki</option>
                                {pets.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {SPECIES[p.species].icon} {p.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </nav>
                )}
            </header>

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
                <Outlet />
            </main>

            <footer className="border-t border-black/5 py-8 text-center text-sm text-ink/60">
                ZooGids · Piegāde uz pakomātiem visā Latvijā 1–2 darba dienās · Prototips {new Date().getFullYear()}
            </footer>

            {toast && (
                <div key={toast.key} className={`fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 font-semibold text-white shadow-lg ${toast.type === 'error' ? 'bg-red-600' : 'bg-ink'}`}>
                    {toast.type === 'error' ? '⚠️ ' : '✅ '}
                    {toast.text}
                </div>
            )}
        </div>
    );
}

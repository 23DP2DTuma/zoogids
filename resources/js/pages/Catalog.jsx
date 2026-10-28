import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { api, SPECIES } from '../lib/api';
import { petFilterParams, useStore } from '../lib/store';

const EMPTY = { q: '', category: '', brand: '', species: '', min_price: '', max_price: '', sort: '', problem: '' };

export default function Catalog() {
    const { activePet } = useStore();
    const [meta, setMeta] = useState(null);
    const [filters, setFilters] = useState(EMPTY);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        api('/meta').then(setMeta).catch((e) => setError(e.message));
    }, []);

    useEffect(() => {
        const params = { ...filters, ...petFilterParams(activePet) };
        const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
        setLoading(true);
        const t = setTimeout(() => {
            api(`/products?${qs}`)
                .then((p) => {
                    setProducts(p);
                    setError(null);
                })
                .catch((e) => setError(e.message))
                .finally(() => setLoading(false));
        }, 200);
        return () => clearTimeout(t);
    }, [filters, activePet]);

    const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

    return (
        <div>
            <h1 className="text-3xl font-extrabold">Katalogs</h1>
            {activePet ? (
                <p className="mt-2 rounded-xl bg-brand-50 px-4 py-3 text-brand-700">
                    Rādām preces, kas piemērotas <b>{activePet.name}</b> ({SPECIES[activePet.species].label.toLowerCase()})
                    {activePet.allergies && (
                        <>
                            {' '}
                            bez alergēna: <b>{activePet.allergies}</b>
                        </>
                    )}
                    . Mainiet mīluli augšējā izvēlnē.
                </p>
            ) : (
                <p className="mt-2 text-ink/70">
                    Padoms: <Link to="/mani-miluli" className="font-semibold text-brand-600">izveidojiet mīluļa profilu</Link>, lai redzētu tikai viņam piemērotas preces.
                </p>
            )}

            <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
                <aside className="card h-fit space-y-4 p-4">
                    <div>
                        <label className="label">Meklēt</label>
                        <input className="input" value={filters.q} onChange={set('q')} placeholder="Nosaukums…" maxLength={100} />
                    </div>
                    {!activePet && (
                        <div>
                            <label className="label">Suga</label>
                            <select className="input" value={filters.species} onChange={set('species')}>
                                <option value="">Visas</option>
                                {Object.entries(SPECIES).map(([k, s]) => (
                                    <option key={k} value={k}>
                                        {s.icon} {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="label">Kategorija</label>
                        <select className="input" value={filters.category} onChange={set('category')}>
                            <option value="">Visas</option>
                            {meta?.categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.icon} {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Zīmols</label>
                        <select className="input" value={filters.brand} onChange={set('brand')}>
                            <option value="">Visi</option>
                            {meta?.brands.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Problēma</label>
                        <select className="input" value={filters.problem} onChange={set('problem')}>
                            <option value="">Jebkura</option>
                            {meta?.problems.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Cena, €</label>
                        <div className="flex gap-2">
                            <input className="input" type="number" min="0" placeholder="no" value={filters.min_price} onChange={set('min_price')} />
                            <input className="input" type="number" min="0" placeholder="līdz" value={filters.max_price} onChange={set('max_price')} />
                        </div>
                    </div>
                    <button className="btn-ghost w-full" onClick={() => setFilters(EMPTY)}>
                        Notīrīt filtrus
                    </button>
                </aside>

                <section>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="text-sm text-ink/60">{loading ? 'Ielādē…' : `Atrasti ${products.length} produkti`}</p>
                        <select className="input w-auto" value={filters.sort} onChange={set('sort')}>
                            <option value="">Kārtot: noklusējums</option>
                            <option value="price_asc">Cena augoši</option>
                            <option value="price_desc">Cena dilstoši</option>
                            <option value="rating">Pēc vērtējuma</option>
                        </select>
                    </div>
                    {error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
                    {!loading && !error && products.length === 0 && (
                        <div className="card p-10 text-center text-ink/60">
                            <div className="text-5xl">🔍</div>
                            <p className="mt-3 font-semibold">Produkti nav atrasti. Pamēģiniet mainīt filtrus.</p>
                        </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {products.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

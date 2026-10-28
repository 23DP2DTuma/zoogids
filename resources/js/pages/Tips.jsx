import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, fmtDate, SPECIES } from '../lib/api';

export function Tips() {
    const [species, setSpecies] = useState('');
    const [articles, setArticles] = useState([]);

    useEffect(() => {
        api(`/articles${species ? `?species=${encodeURIComponent(species)}` : ''}`).then(setArticles).catch(() => setArticles([]));
    }, [species]);

    return (
        <div>
            <h1 className="text-3xl font-extrabold">📚 Padomi iesācējiem</h1>
            <div className="mt-4 flex flex-wrap gap-2">
                {[['', 'Visi'], ...Object.entries(SPECIES).map(([k, s]) => [k, `${s.icon} ${s.label}`])].map(([k, l]) => (
                    <button key={k} onClick={() => setSpecies(k)} className={`chip ${species === k ? 'bg-brand-500 text-white' : 'bg-white border border-black/10'}`}>
                        {l}
                    </button>
                ))}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
                {articles.map((a) => (
                    <Link key={a.id} to={`/padomi/${a.id}`} className="card p-5 hover:border-brand-500">
                        <p className="text-sm font-semibold text-brand-600">
                            {SPECIES[a.species].icon} {SPECIES[a.species].label} · {fmtDate(a.published_at)}
                        </p>
                        <h2 className="mt-1 text-lg font-extrabold">{a.title}</h2>
                        <p className="mt-1 text-sm text-ink/70">{a.excerpt}</p>
                    </Link>
                ))}
                {articles.length === 0 && <p className="text-ink/60">Šai sugai raksti vēl nav publicēti.</p>}
            </div>
        </div>
    );
}

export function Article() {
    const { id } = useParams();
    const [a, setA] = useState(null);
    useEffect(() => {
        api(`/articles/${id}`).then(setA).catch(() => setA(false));
    }, [id]);
    if (a === false) return <p>Raksts nav atrasts.</p>;
    if (!a) return <p className="text-ink/60">Ielādē…</p>;
    return (
        <article className="mx-auto max-w-2xl">
            <Link to="/padomi" className="text-sm font-semibold text-brand-600">
                ← Visi padomi
            </Link>
            <p className="mt-4 text-sm font-semibold text-brand-600">
                {SPECIES[a.species].icon} {SPECIES[a.species].label} · {fmtDate(a.published_at)}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold">{a.title}</h1>
            <p className="mt-3 text-lg text-ink/70">{a.excerpt}</p>
            <div className="mt-6 space-y-4 leading-relaxed">
                {a.content.split('\n\n').map((p, i) => (
                    <p key={i}>{p}</p>
                ))}
            </div>
            <div className="card mt-8 flex flex-wrap items-center justify-between gap-3 p-5">
                <p className="font-semibold">Gribat atgādinājumus par vakcināciju?</p>
                <Link to="/mani-miluli" className="btn-primary">
                    Izveidot mīluļa profilu
                </Link>
            </div>
        </article>
    );
}

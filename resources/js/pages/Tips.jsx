import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loading } from '../components/Guards';
import { useI18n } from '../lang';
import { api, fmtDate, SPECIES } from '../lib/api';
import { useAuth } from '../lib/auth';
import NotFound from './NotFound';

export function Tips() {
    const { t } = useI18n();
    const [species, setSpecies] = useState('');
    const [articles, setArticles] = useState(null);

    useEffect(() => {
        api('/articles', { params: species ? { species } : {} })
            .then(setArticles)
            .catch(() => setArticles([]));
    }, [species]);

    return (
        <div>
            <h1 className="text-3xl font-extrabold">📚 {t('tips.title')}</h1>
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t('attr.species')}>
                {[['', t('common.all')], ...Object.entries(SPECIES).map(([k, s]) => [k, `${s.icon} ${s.label}`])].map(([k, l]) => (
                    <button key={k} onClick={() => setSpecies(k)} aria-pressed={species === k} className={`chip ${species === k ? 'bg-brand-500 text-white' : 'border border-black/10 bg-white'}`}>
                        {l}
                    </button>
                ))}
            </div>
            {!articles ? (
                <Loading />
            ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {articles.map((a) => (
                        <Link key={a.id} to={`/padomi/${a.id}`} className="card p-5 hover:border-brand-500">
                            <p className="text-sm font-semibold text-brand-600">
                                {SPECIES[a.species]?.icon} {SPECIES[a.species]?.label} · {fmtDate(a.published_at)}
                            </p>
                            <h2 className="mt-1 text-lg font-extrabold">{a.title}</h2>
                            <p className="mt-1 text-sm text-ink/70">{a.excerpt}</p>
                        </Link>
                    ))}
                    {articles.length === 0 && <p className="text-ink/60">{t('tips.none')}</p>}
                </div>
            )}
        </div>
    );
}

export function Article() {
    const { t } = useI18n();
    const { user } = useAuth();
    const { id } = useParams();
    const [a, setA] = useState(null);

    useEffect(() => {
        api(`/articles/${id}`)
            .then(setA)
            .catch(() => setA(false));
    }, [id]);

    if (a === false) return <NotFound />;
    if (!a) return <Loading />;

    return (
        <article className="mx-auto max-w-2xl">
            <Link to="/padomi" className="text-sm font-semibold text-brand-600">
                ← {t('tips.all')}
            </Link>
            <p className="mt-4 text-sm font-semibold text-brand-600">
                {SPECIES[a.species]?.icon} {SPECIES[a.species]?.label} · {fmtDate(a.published_at)}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold break-words">{a.title}</h1>
            <p className="mt-3 text-lg text-ink/70">{a.excerpt}</p>
            <div className="mt-6 space-y-4 leading-relaxed">
                {a.content.split('\n\n').map((p, i) => (
                    <p key={i} className="whitespace-pre-line">
                        {p}
                    </p>
                ))}
            </div>
            <div className="card mt-8 flex flex-wrap items-center justify-between gap-3 p-5">
                <p className="font-semibold">{t('tips.cta')}</p>
                <Link to={user ? '/profils?tab=miluli' : '/registreties'} className="btn-primary">
                    {t('tips.ctaButton')}
                </Link>
            </div>
        </article>
    );
}

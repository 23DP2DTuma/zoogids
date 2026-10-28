import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useI18n } from '../lang';
import { api, SPECIES } from '../lib/api';
import { useStore } from '../lib/store';

const FEATURES = [
    ['🐾', 'home.f1t', 'home.f1', '/profils?tab=miluli'],
    ['✨', 'home.f2t', 'home.f2', '/gudrais-filtrs'],
    ['⚖️', 'home.f3t', 'home.f3', '/kalkulators'],
    ['🔁', 'home.f4t', 'home.f4', '/katalogs'],
];

export default function Home() {
    const { t } = useI18n();
    const { activePet } = useStore();
    const [text, setText] = useState('');
    const [popular, setPopular] = useState([]);
    const [articles, setArticles] = useState([]);
    const navigate = useNavigate();
    const [heroPre, heroPost] = t('home.hero').split('{pet}');

    useEffect(() => {
        api('/products', { params: { sort: 'rating', per_page: 4 } })
            .then((res) => setPopular(res.data))
            .catch(() => {});
        api('/articles')
            .then((list) => setArticles(list.slice(0, 2)))
            .catch(() => {});
    }, []);

    return (
        <div className="space-y-14">
            <section className="relative overflow-hidden rounded-3xl bg-brand-600 px-5 py-10 text-white sm:px-12 sm:py-16">
                <div className="absolute -top-10 -right-10 text-[10rem] leading-none opacity-15 select-none sm:text-[14rem]" aria-hidden>
                    🐕
                </div>
                <div className="relative max-w-2xl">
                    <p className="chip mb-4 bg-white/15">{t('home.badge')}</p>
                    <h1 className="text-3xl leading-tight font-extrabold break-words sm:text-5xl">
                        {heroPre}
                        {activePet ? <span className="text-sun">{activePet.name}</span> : t('home.heroPet')}
                        {heroPost}
                    </h1>
                    <p className="mt-4 text-lg text-white/85">{t('home.heroText')}</p>
                    <form
                        className="mt-6 flex flex-col gap-2 sm:flex-row"
                        onSubmit={(e) => {
                            e.preventDefault();
                            navigate(`/gudrais-filtrs?q=${encodeURIComponent(text)}`);
                        }}
                    >
                        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} aria-label={t('attr.text')} className="input flex-1 text-ink" placeholder={t('home.placeholder')} />
                        <button className="btn bg-sun text-ink hover:brightness-95">✨ {t('smart.submit')}</button>
                    </form>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                        {t('home.examples').map((s) => (
                            <button key={s} onClick={() => navigate(`/gudrais-filtrs?q=${encodeURIComponent(s)}`)} className="chip bg-white/10 hover:bg-white/20">
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {FEATURES.map(([icon, title, text, to]) => (
                    <Link key={title} to={to} className="card p-5 transition hover:border-brand-500">
                        <div className="text-3xl">{icon}</div>
                        <h3 className="mt-3 font-extrabold">{t(title)}</h3>
                        <p className="mt-1 text-sm text-ink/70">{t(text)}</p>
                    </Link>
                ))}
            </section>

            <section>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                    <h2 className="text-2xl font-extrabold">{t('home.popular')}</h2>
                    <Link to="/katalogs" className="font-semibold text-brand-600">
                        {t('home.allCatalog')} →
                    </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {popular.map((p) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
                {articles.map((a) => (
                    <Link key={a.id} to={`/padomi/${a.id}`} className="card flex items-center gap-4 p-6 hover:border-brand-500">
                        <span className="text-5xl">{SPECIES[a.species]?.icon}</span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-brand-600">{t('home.guide')}</p>
                            <h3 className="text-lg font-extrabold">{a.title}</h3>
                        </div>
                    </Link>
                ))}
            </section>
        </div>
    );
}

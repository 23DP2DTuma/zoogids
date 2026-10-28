import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { api } from '../lib/api';
import { useStore } from '../lib/store';

const FEATURES = [
    ['🐾', 'Mīluļa profils', 'Katalogs rāda tikai sugai un vecumam piemērotas preces bez alergēniem.', '/mani-miluli'],
    ['✨', 'Gudrais filtrs', 'Aprakstiet problēmu saviem vārdiem — mēs ieteiksim risinājumu.', '/gudrais-filtrs'],
    ['⚖️', 'Barības kalkulators', 'Ieteicamā dienas deva un cik dienām pietiks iepakojuma.', '/kalkulators'],
    ['🔁', 'Abonements −10 %', 'Barība atbrauc automātiski ik pēc 7–90 dienām.', '/katalogs'],
];

export default function Home() {
    const { activePet } = useStore();
    const [text, setText] = useState('');
    const [popular, setPopular] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        api('/products?sort=rating').then((p) => setPopular(p.slice(0, 4))).catch(() => {});
    }, []);

    return (
        <div className="space-y-14">
            <section className="relative overflow-hidden rounded-3xl bg-brand-600 px-6 py-12 text-white sm:px-12 sm:py-16">
                <div className="absolute -top-10 -right-10 text-[14rem] leading-none opacity-15 select-none">🐕</div>
                <div className="relative max-w-2xl">
                    <p className="chip mb-4 bg-white/15">Mājdzīvnieku preču gids iesācējiem</p>
                    <h1 className="text-4xl leading-tight font-extrabold sm:text-5xl">
                        Kas vajadzīgs {activePet ? <span className="text-sun">{activePet.name}</span> : 'jūsu mīlulim'}?
                    </h1>
                    <p className="mt-4 text-lg text-white/85">Aprakstiet problēmu — ZooGids atlasīs piemērotas preces.</p>
                    <form
                        className="mt-6 flex flex-col gap-2 sm:flex-row"
                        onSubmit={(e) => {
                            e.preventDefault();
                            navigate(`/gudrais-filtrs?q=${encodeURIComponent(text)}`);
                        }}
                    >
                        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} className="input flex-1 text-ink" placeholder="piem., “suns visu laiku kasās”" />
                        <button className="btn bg-sun text-ink hover:brightness-95">✨ Atrast risinājumu</button>
                    </form>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                        {['kaķis daudz met spalvu', 'suns ir par resnu', 'kucēnam jutīgs vēders'].map((s) => (
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
                        <h3 className="mt-3 font-extrabold">{title}</h3>
                        <p className="mt-1 text-sm text-ink/70">{text}</p>
                    </Link>
                ))}
            </section>

            <section>
                <div className="mb-4 flex items-end justify-between">
                    <h2 className="text-2xl font-extrabold">Populārākie produkti</h2>
                    <Link to="/katalogs" className="font-semibold text-brand-600">
                        Viss katalogs →
                    </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {popular.map((p) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
                <Link to="/padomi/1" className="card flex items-center gap-4 p-6 hover:border-brand-500">
                    <span className="text-5xl">🐶</span>
                    <div>
                        <p className="text-sm font-semibold text-brand-600">Ceļvedis iesācējiem</p>
                        <h3 className="text-lg font-extrabold">Pirmais kucēns</h3>
                    </div>
                </Link>
                <Link to="/padomi/2" className="card flex items-center gap-4 p-6 hover:border-brand-500">
                    <span className="text-5xl">🐱</span>
                    <div>
                        <p className="text-sm font-semibold text-brand-600">Ceļvedis iesācējiem</p>
                        <h3 className="text-lg font-extrabold">Pirmais kaķēns</h3>
                    </div>
                </Link>
            </section>
        </div>
    );
}

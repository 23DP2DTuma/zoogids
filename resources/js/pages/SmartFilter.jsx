import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { api, SPECIES } from '../lib/api';
import { useStore } from '../lib/store';

const EXAMPLES = ['Suns visu laiku kasās', 'Kaķis daudz met spalvu', 'Kucēnam caureja pēc barības maiņas', 'Sunim smaka no mutes', 'Кот сильно линяет'];

export default function SmartFilter() {
    const [params, setParams] = useSearchParams();
    const { activePet } = useStore();
    const [text, setText] = useState(params.get('q') || '');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const run = async (value) => {
        if (!value.trim()) {
            setError('Lūdzu, aprakstiet problēmu.');
            return;
        }
        setLoading(true);
        setError(null);
        setParams({ q: value });
        try {
            setResult(await api('/smart-filter', { method: 'POST', body: { text: value, species: activePet?.species } }));
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.get('q')) run(params.get('q'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePet?.id]);

    return (
        <div className="mx-auto max-w-4xl">
            <h1 className="text-3xl font-extrabold">✨ Gudrais filtrs</h1>
            <p className="mt-2 text-ink/70">Nezināt, ko meklēt? Aprakstiet mīluļa problēmu savos vārdos (latviski, krieviski vai angliski).</p>

            <form
                className="card mt-6 p-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    run(text);
                }}
            >
                <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={300} rows={3} className="input resize-none" placeholder="piem., “mans kaķis daudz met spalvu un bieži vemj”" />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-ink/50">{text.length}/300</span>
                    <button className="btn-primary" disabled={loading}>
                        {loading ? 'Analizē…' : 'Atrast risinājumu'}
                    </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {EXAMPLES.map((ex) => (
                        <button
                            type="button"
                            key={ex}
                            className="chip bg-black/5 hover:bg-brand-100"
                            onClick={() => {
                                setText(ex);
                                run(ex);
                            }}
                        >
                            {ex}
                        </button>
                    ))}
                </div>
            </form>

            {error && <p className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}

            {result && (
                <div className="mt-8 space-y-6">
                    {result.problems.length === 0 ? (
                        <div className="card p-8 text-center">
                            <div className="text-5xl">🤔</div>
                            <p className="mt-3 font-semibold">Neizdevās atpazīt problēmu. Pamēģiniet aprakstīt sīkāk vai konsultējieties ar veterinārārstu.</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <p className="text-sm font-semibold text-ink/60">
                                    Atpazītās problēmas{result.species && ` · ${SPECIES[result.species].icon} ${SPECIES[result.species].label}`}
                                </p>
                                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                    {result.problems.map((p) => (
                                        <div key={p.id} className="rounded-xl border-l-4 border-brand-500 bg-white p-4">
                                            <p className="font-bold">{p.name}</p>
                                            <p className="mt-1 text-sm text-ink/70">{p.advice}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h2 className="mb-3 text-xl font-extrabold">Ieteiktie produkti ({result.products.length})</h2>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {result.products.map((p) => (
                                        <ProductCard key={p.id} product={p} />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                    <p className="text-xs text-ink/50">Prototipā filtrs darbojas pēc atslēgvārdiem. Pilnajā versijā tiks izmantots MI valodas modelis.</p>
                </div>
            )}
        </div>
    );
}

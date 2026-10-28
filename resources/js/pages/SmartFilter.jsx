import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useI18n } from '../lang';
import { api, SPECIES } from '../lib/api';
import { useStore } from '../lib/store';
import { max, required, validate } from '../lib/validate';

export default function SmartFilter() {
    const { t } = useI18n();
    const [params, setParams] = useSearchParams();
    const { activePet } = useStore();
    const [text, setText] = useState(params.get('q') || '');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const run = async (value) => {
        const errs = validate({ text: value }, { text: [required, max(300)] });
        if (errs.text) {
            setError(value.trim() ? errs.text : t('val.problem'));
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
    }, [activePet?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="mx-auto max-w-4xl">
            <h1 className="text-3xl font-extrabold">✨ {t('smart.title')}</h1>
            <p className="mt-2 text-ink/70">{t('smart.subtitle')}</p>

            <form
                className="card mt-6 p-4"
                noValidate
                onSubmit={(e) => {
                    e.preventDefault();
                    run(text);
                }}
            >
                <label htmlFor="smart-text" className="sr-only">
                    {t('attr.text')}
                </label>
                <textarea id="smart-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={300} rows={3} className="input resize-none" placeholder={t('smart.placeholder')} aria-invalid={error ? true : undefined} />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-ink/50">{text.length}/300</span>
                    <button className="btn-primary" disabled={loading}>
                        {loading ? t('smart.analyzing') : t('smart.submit')}
                    </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {t('smart.examples').map((ex) => (
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

            {error && (
                <p className="mt-4 rounded-xl bg-red-50 p-4 text-red-700" role="alert">
                    {error}
                </p>
            )}

            {result && (
                <div className="mt-8 space-y-6">
                    {result.problems.length === 0 ? (
                        <div className="card p-8 text-center">
                            <div className="text-5xl">🤔</div>
                            <p className="mt-3 font-semibold">{t('smart.notRecognized')}</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <p className="text-sm font-semibold text-ink/60">
                                    {t('smart.recognized')}
                                    {result.species && ` · ${SPECIES[result.species]?.icon} ${SPECIES[result.species]?.label}`}
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
                                <h2 className="mb-3 text-xl font-extrabold">{t('smart.suggested', { n: result.products.length })}</h2>
                                {result.products.length === 0 && <p className="text-ink/60">{t('smart.noProducts')}</p>}
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {result.products.map((p) => (
                                        <ProductCard key={p.id} product={p} />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                    <p className="text-xs text-ink/50">{result.driver === 'llm' ? t('smart.driverLlm') : t('smart.driverKeywords')}</p>
                </div>
            )}
        </div>
    );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Field } from '../components/Modal';
import { useI18n } from '../lang';
import { ageMonths, api, calcDailyFood, eur, SPECIES } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useStore } from '../lib/store';

export default function Calculator() {
    const { t } = useI18n();
    const { user } = useAuth();
    const { pets, activePet } = useStore();
    const [params] = useSearchParams();
    // Pieteiktam lietotājam — mīluļi no servera; viesim — manuāla ievade
    const [petId, setPetId] = useState(params.get('pet') || activePet?.id || '');
    const [manual, setManual] = useState({ species: 'suns', weight: 10, months: 24, activity: 'normal' });
    const [foods, setFoods] = useState([]);
    const [foodId, setFoodId] = useState('');

    useEffect(() => {
        if (!petId && pets.length && !params.get('manual')) setPetId(activePet?.id || pets[0].id);
    }, [pets]); // eslint-disable-line react-hooks/exhaustive-deps

    const pet = pets.find((p) => String(p.id) === String(petId));
    const input = pet ? { species: pet.species, weight: pet.weight, months: ageMonths(pet.birth_date), activity: pet.activity || 'normal' } : manual;

    useEffect(() => {
        api('/products', { params: { species: input.species, food: 1, per_page: 100, exclude: pet?.allergies || undefined } })
            .then((res) => {
                setFoods(res.data);
                setFoodId((cur) => (res.data.some((x) => String(x.id) === String(cur)) ? cur : (res.data[0]?.id ?? '')));
            })
            .catch(() => setFoods([]));
    }, [input.species, pet?.allergies]);

    const food = foods.find((f) => String(f.id) === String(foodId));
    const result = useMemo(
        () => (food ? calcDailyFood({ ...input, kcalPer100g: food.kcal_per_100g, packageWeight: food.package_weight }) : null),
        [food, input.species, input.weight, input.months, input.activity], // eslint-disable-line react-hooks/exhaustive-deps
    );

    const setM = (k) => (e) => setManual((m) => ({ ...m, [k]: e.target.value }));

    return (
        <div className="mx-auto max-w-4xl">
            <h1 className="text-3xl font-extrabold">⚖️ {t('calc.title')}</h1>
            <p className="mt-2 text-ink/70">{t('calc.subtitle')}</p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="card space-y-4 p-5">
                    {user ? (
                        <Field label={t('calc.pet')}>
                            <select className="input" value={petId} onChange={(e) => setPetId(e.target.value)}>
                                {pets.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {SPECIES[p.species]?.icon} {p.name} ({Number(p.weight).toFixed(2).replace('.', ',')} kg)
                                    </option>
                                ))}
                                <option value="">{t('calc.manual')}</option>
                            </select>
                        </Field>
                    ) : (
                        <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-700">
                            <Link to="/pieslegties?next=/kalkulators" className="font-bold underline">
                                {t('auth.login')}
                            </Link>{' '}
                            {t('calc.guestHint')}
                        </p>
                    )}
                    {pet?.allergies && <p className="text-xs text-ink/60">{t('calc.allergyFiltered', { list: pet.allergies })}</p>}
                    {!pet && (
                        <div className="grid grid-cols-2 gap-3">
                            <Field label={t('attr.species')}>
                                <select className="input" value={manual.species} onChange={setM('species')}>
                                    <option value="suns">{SPECIES.suns.label}</option>
                                    <option value="kaķis">{SPECIES.kaķis.label}</option>
                                </select>
                            </Field>
                            <Field label={`${t('attr.weight')}, kg`}>
                                <input className="input" type="number" step="0.1" min="0.1" value={manual.weight} onChange={setM('weight')} />
                            </Field>
                            <Field label={t('calc.ageMonths')}>
                                <input className="input" type="number" min="1" value={manual.months} onChange={(e) => setManual((m) => ({ ...m, months: Number(e.target.value) }))} />
                            </Field>
                            <Field label={t('attr.activity')}>
                                <select className="input" value={manual.activity} onChange={setM('activity')}>
                                    {['low', 'normal', 'high'].map((a) => (
                                        <option key={a} value={a}>
                                            {t(`pets.activity.${a}`)}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                    )}
                    <Field label={t('calc.food')} hint={food ? t('calc.foodInfo', { kcal: food.kcal_per_100g, g: food.package_weight }) : null}>
                        <select className="input" value={foodId} onChange={(e) => setFoodId(e.target.value)}>
                            {foods.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.name} — {eur(f.price)}
                                </option>
                            ))}
                        </select>
                    </Field>
                    {foods.length === 0 && <p className="text-sm text-ink/60">{t('calc.noFoods')}</p>}
                </div>

                <div className="card flex flex-col justify-center bg-brand-600 p-6 text-white" aria-live="polite">
                    {result ? (
                        <>
                            <p className="text-white/80">{t('calc.daily')}</p>
                            <p className="text-6xl font-extrabold">{result.grams} g</p>
                            <p className="mt-1 text-white/80">{t('calc.kcalLine', { kcal: result.kcal, half: Math.round(result.grams / 2) })}</p>
                            {result.days && (
                                <div className="mt-6 rounded-xl bg-white/15 p-4">
                                    <p className="text-sm text-white/80">{t('calc.lasts')}</p>
                                    <p className="text-3xl font-extrabold">{t('calc.days', { n: result.days })}</p>
                                    <p className="mt-1 text-sm text-white/80">{t('calc.interval', { n: result.interval })}</p>
                                </div>
                            )}
                            {food && (
                                <Link to={`/produkts/${food.id}`} className="btn mt-5 bg-sun text-ink hover:brightness-95">
                                    {t('calc.toProduct')}
                                </Link>
                            )}
                        </>
                    ) : (
                        <p>{t('calc.empty')}</p>
                    )}
                </div>
            </div>
            <p className="mt-4 text-xs text-ink/50">{t('calc.formula')}</p>
        </div>
    );
}

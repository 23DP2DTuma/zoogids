import { useEffect, useMemo, useState } from 'react';
import { api, ageMonths, calcDailyFood, eur } from '../lib/api';
import { useStore } from '../lib/store';

export default function Calculator() {
    const { pets, activePet } = useStore();
    const [petId, setPetId] = useState(activePet?.id || pets[0]?.id || '');
    const [manual, setManual] = useState({ species: 'suns', weight: 10, months: 24, activity: 'normal' });
    const [foods, setFoods] = useState([]);
    const [foodId, setFoodId] = useState('');

    const pet = pets.find((p) => p.id === petId);
    const input = pet ? { species: pet.species, weight: pet.weight, months: ageMonths(pet.birthdate), activity: pet.activity || 'normal' } : manual;

    useEffect(() => {
        api(`/products?species=${encodeURIComponent(input.species)}`).then((list) => {
            const f = list.filter((p) => p.kcal_per_100g);
            setFoods(f);
            setFoodId((cur) => (f.some((x) => String(x.id) === String(cur)) ? cur : f[0]?.id ?? ''));
        });
    }, [input.species]);

    const food = foods.find((f) => String(f.id) === String(foodId));
    const result = useMemo(() => (food ? calcDailyFood({ ...input, kcalPer100g: food.kcal_per_100g, packageWeight: food.package_weight }) : null), [food, input.species, input.weight, input.months, input.activity]);

    const setM = (k) => (e) => setManual((m) => ({ ...m, [k]: e.target.value }));

    return (
        <div className="mx-auto max-w-4xl">
            <h1 className="text-3xl font-extrabold">⚖️ Barības kalkulators</h1>
            <p className="mt-2 text-ink/70">Aprēķina ieteicamo dienas devu un to, cik dienām pietiks iepakojuma.</p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="card space-y-4 p-5">
                    <div>
                        <label className="label">Mīlulis</label>
                        <select className="input" value={petId} onChange={(e) => setPetId(e.target.value)}>
                            {pets.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.weight} kg)
                                </option>
                            ))}
                            <option value="">Ievadīt manuāli…</option>
                        </select>
                    </div>
                    {!pet && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label">Suga</label>
                                <select className="input" value={manual.species} onChange={setM('species')}>
                                    <option value="suns">Suns</option>
                                    <option value="kaķis">Kaķis</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Svars, kg</label>
                                <input className="input" type="number" step="0.1" min="0.1" value={manual.weight} onChange={setM('weight')} />
                            </div>
                            <div>
                                <label className="label">Vecums, mēn.</label>
                                <input className="input" type="number" min="1" value={manual.months} onChange={(e) => setManual((m) => ({ ...m, months: Number(e.target.value) }))} />
                            </div>
                            <div>
                                <label className="label">Aktivitāte</label>
                                <select className="input" value={manual.activity} onChange={setM('activity')}>
                                    <option value="low">Zema</option>
                                    <option value="normal">Vidēja</option>
                                    <option value="high">Augsta</option>
                                </select>
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="label">Barība</label>
                        <select className="input" value={foodId} onChange={(e) => setFoodId(e.target.value)}>
                            {foods.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.name} — {eur(f.price)}
                                </option>
                            ))}
                        </select>
                        {food && <p className="mt-1 text-xs text-ink/50">{food.kcal_per_100g} kcal / 100 g · iepakojums {food.package_weight} g</p>}
                    </div>
                </div>

                <div className="card flex flex-col justify-center bg-brand-600 p-6 text-white">
                    {result ? (
                        <>
                            <p className="text-white/80">Ieteicamā dienas deva</p>
                            <p className="text-6xl font-extrabold">{result.grams} g</p>
                            <p className="mt-1 text-white/80">≈ {result.kcal} kcal dienā · 2 ēdienreizes pa {Math.round(result.grams / 2)} g</p>
                            {result.days && (
                                <div className="mt-6 rounded-xl bg-white/15 p-4">
                                    <p className="text-sm text-white/80">Iepakojums pietiks</p>
                                    <p className="text-3xl font-extrabold">{result.days} dienām</p>
                                    <p className="mt-1 text-sm text-white/80">Ieteicamais abonementa intervāls: {Math.min(90, Math.max(7, result.days - 2))} dienas</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <p>Ievadiet svaru un izvēlieties barību.</p>
                    )}
                </div>
            </div>
            <p className="mt-4 text-xs text-ink/50">Formula: RER = 70 × svars^0,75, reizināts ar vecuma un aktivitātes koeficientu. Rezultāts ir orientējošs — konsultējieties ar veterinārārstu.</p>
        </div>
    );
}

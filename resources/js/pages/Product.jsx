import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, calcDailyFood, ageMonths, eur, SPECIES } from '../lib/api';
import { useStore } from '../lib/store';

export default function Product() {
    const { id } = useParams();
    const { addToCart, activePet } = useStore();
    const [product, setProduct] = useState(null);
    const [qty, setQty] = useState(1);
    const [error, setError] = useState(null);

    useEffect(() => {
        api(`/products/${id}`).then(setProduct).catch((e) => setError(e.message));
    }, [id]);

    if (error) return <p className="rounded-xl bg-red-50 p-4 text-red-700">Produkts nav atrasts.</p>;
    if (!product) return <p className="text-ink/60">Ielādē…</p>;

    const allergyHit = activePet?.allergies && product.ingredients?.toLowerCase().includes(activePet.allergies.toLowerCase());
    const wrongSpecies = activePet && activePet.species !== product.species;
    const calc =
        activePet && !wrongSpecies && product.kcal_per_100g
            ? calcDailyFood({ species: activePet.species, weight: activePet.weight, months: ageMonths(activePet.birthdate), activity: activePet.activity, kcalPer100g: product.kcal_per_100g, packageWeight: product.package_weight })
            : null;

    return (
        <div>
            <Link to="/katalogs" className="text-sm font-semibold text-brand-600">
                ← Atpakaļ uz katalogu
            </Link>
            <div className="mt-4 grid gap-8 md:grid-cols-2">
                <div className="card grid aspect-square place-items-center bg-brand-50 text-[9rem]">{product.image}</div>
                <div>
                    <p className="text-sm font-semibold text-ink/60">
                        {product.brand.name} · {product.category.name} · {SPECIES[product.species].icon} {SPECIES[product.species].label}
                    </p>
                    <h1 className="mt-2 text-3xl font-extrabold">{product.name}</h1>
                    <p className="mt-2 text-sun">
                        {'★'.repeat(Math.round(product.rating))}
                        <span className="text-ink/30">{'★'.repeat(5 - Math.round(product.rating))}</span> <span className="text-sm text-ink/60">{Number(product.rating).toFixed(1)}</span>
                    </p>
                    <p className="mt-4 text-ink/80">{product.description}</p>
                    {product.ingredients && (
                        <p className="mt-3 text-sm">
                            <b>Sastāvs:</b> {product.ingredients}
                        </p>
                    )}
                    {product.problems.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {product.problems.map((p) => (
                                <span key={p.id} className="chip bg-brand-100 text-brand-700">
                                    ✓ {p.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {allergyHit && <p className="mt-4 rounded-xl bg-red-50 p-3 font-semibold text-red-700">⚠️ Satur alergēnu, kas norādīts {activePet.name} profilā: {activePet.allergies}</p>}
                    {wrongSpecies && <p className="mt-4 rounded-xl bg-amber-50 p-3 font-semibold text-amber-800">Šis produkts paredzēts citai sugai, nevis {activePet.name}.</p>}
                    {calc && (
                        <div className="mt-4 rounded-xl bg-brand-50 p-4">
                            <p className="font-bold text-brand-700">⚖️ Deva priekš {activePet.name}</p>
                            <p className="mt-1 text-sm">
                                ~<b>{calc.grams} g</b> dienā{calc.days && (
                                    <>
                                        {' '}
                                        · iepakojums pietiks <b>{calc.days} dienām</b>
                                    </>
                                )}
                            </p>
                        </div>
                    )}

                    <div className="mt-6 flex items-center gap-3">
                        <span className="text-3xl font-extrabold">{eur(product.price)}</span>
                        <span className={`text-sm ${product.stock > 0 ? 'text-brand-600' : 'text-red-600'}`}>{product.stock > 0 ? `Noliktavā: ${product.stock}` : 'Nav noliktavā'}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <input type="number" min={1} max={product.stock} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(product.stock, Number(e.target.value))))} className="input w-24" />
                        <button className="btn-primary flex-1" disabled={product.stock < 1} onClick={() => addToCart(product, qty)}>
                            Pievienot grozam
                        </button>
                    </div>
                    <p className="mt-3 text-sm text-ink/60">🔁 Grozā var noformēt abonementu ar −10 % atlaidi.</p>
                </div>
            </div>
        </div>
    );
}

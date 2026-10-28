import { Link } from 'react-router-dom';
import { eur, SPECIES } from '../lib/api';
import { useStore } from '../lib/store';

export default function ProductCard({ product }) {
    const { addToCart } = useStore();
    return (
        <div className="card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
            <Link to={`/produkts/${product.id}`} className="grid h-36 place-items-center bg-brand-50 text-6xl">
                {product.image}
            </Link>
            <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-ink/60">
                    <span>{product.brand?.name}</span>
                    <span>·</span>
                    <span>
                        {SPECIES[product.species]?.icon} {SPECIES[product.species]?.label}
                    </span>
                    <span className="ml-auto text-sun">★ {Number(product.rating).toFixed(1)}</span>
                </div>
                <Link to={`/produkts/${product.id}`} className="leading-snug font-bold hover:text-brand-600">
                    {product.name}
                </Link>
                <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-lg font-extrabold">{eur(product.price)}</span>
                    <button className="btn-primary px-3 py-2 text-sm" disabled={product.stock < 1} onClick={() => addToCart(product)}>
                        {product.stock < 1 ? 'Nav noliktavā' : 'Grozā'}
                    </button>
                </div>
            </div>
        </div>
    );
}

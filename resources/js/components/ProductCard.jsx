import { Link } from 'react-router-dom';
import { useI18n } from '../lang';
import { eur, imageUrl, isImagePath, SPECIES } from '../lib/api';
import { useStore } from '../lib/store';

/** Produkta attēls: augšupielādēts fails vai emoji. */
export function ProductImage({ product, className = '' }) {
    if (isImagePath(product.image)) return <img src={imageUrl(product.image)} alt={product.name} loading="lazy" className={`size-full object-cover ${className}`} />;
    return <span aria-hidden>{product.image || '📦'}</span>;
}

export default function ProductCard({ product }) {
    const { t } = useI18n();
    const { addToCart } = useStore();
    return (
        <div className="card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
            <Link to={`/produkts/${product.id}`} className="grid h-36 place-items-center overflow-hidden bg-brand-50 text-6xl" tabIndex={-1}>
                <ProductImage product={product} />
            </Link>
            <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center gap-x-2 text-xs font-semibold text-ink/60">
                    <span>{product.brand?.name}</span>
                    <span>·</span>
                    <span>
                        {SPECIES[product.species]?.icon} {SPECIES[product.species]?.label}
                    </span>
                    <span className="ml-auto text-sun" title={t('product.rating')}>
                        ★ {Number(product.rating).toFixed(1)}
                    </span>
                </div>
                <Link to={`/produkts/${product.id}`} className="leading-snug font-bold hover:text-brand-600">
                    {product.name}
                </Link>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <span className="text-lg font-extrabold">{eur(product.price)}</span>
                    <button className="btn-primary px-3 py-2 text-sm" disabled={product.stock < 1} onClick={() => addToCart(product)}>
                        {product.stock < 1 ? t('product.outOfStock') : t('product.toCart')}
                    </button>
                </div>
            </div>
        </div>
    );
}

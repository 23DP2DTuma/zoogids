import { useEffect, useState } from 'react';
import CrudPage from '../../components/admin/CrudPage';
import { Field } from '../../components/Modal';
import { ProductImage } from '../../components/ProductCard';
import { useI18n } from '../../lang';
import { api, eur, fmtDate, imageUrl, isImagePath, SPECIES, today } from '../../lib/api';
import { decimals, integer, max, minNum, positive, required } from '../../lib/validate';

const speciesOptions = () => Object.entries(SPECIES).map(([k, s]) => [k, `${s.icon} ${s.label}`]);

function useMeta() {
    const [meta, setMeta] = useState({ categories: [], brands: [], problems: [] });
    useEffect(() => {
        api('/meta').then(setMeta).catch(() => {});
    }, []);
    return meta;
}

/** Vairāku vērtību izvēle ar izvēles rūtiņām. */
function CheckList({ label, items, value, onChange }) {
    const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
    return (
        <fieldset>
            <legend className="label">{label}</legend>
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-black/10 p-2">
                {items.map((i) => (
                    <label key={i.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-black/5">
                        <input type="checkbox" className="accent-brand-500" checked={value.includes(i.id)} onChange={() => toggle(i.id)} />
                        {i.name}
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

const EMPTY_PRODUCT = { name: '', description: '', price: '', stock: 0, species: 'suns', age_group: 'visi', package_weight: '', kcal_per_100g: '', ingredients: '', image: '📦', image_file: null, remove_image: false, category_id: '', brand_id: '', problems: [] };

export function ProductsAdmin() {
    const { t } = useI18n();
    const meta = useMeta();

    return (
        <CrudPage
            endpoint="/admin/products"
            title={t('admin.products')}
            newLabel={t('admin.newProduct')}
            modalSize="max-w-2xl"
            filters={[
                { key: 'category', label: t('attr.category_id'), options: meta.categories.map((c) => [c.id, `${c.icon || ''} ${c.name}`]) },
                { key: 'species', label: t('attr.species'), options: speciesOptions() },
            ]}
            columns={[
                {
                    label: t('admin.product'),
                    render: (p) => (
                        <span className="flex items-center gap-2">
                            <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-50 text-xl">
                                <ProductImage product={p} />
                            </span>
                            <span className="line-clamp-2 font-semibold">{p.name}</span>
                        </span>
                    ),
                },
                { label: t('attr.category_id'), render: (p) => `${p.category?.icon || ''} ${p.category?.name || ''}` },
                { label: t('attr.species'), render: (p) => `${SPECIES[p.species]?.icon} ${SPECIES[p.species]?.label}` },
                { label: t('attr.price'), className: 'text-right whitespace-nowrap', render: (p) => eur(p.price) },
                { label: t('admin.stockShort'), className: 'text-right', render: (p) => <span className={p.stock === 0 ? 'font-bold text-red-600' : ''}>{p.stock}</span> },
                { label: '★', className: 'text-right', render: (p) => Number(p.rating).toFixed(1) },
            ]}
            empty={EMPTY_PRODUCT}
            toForm={(p) => ({
                ...EMPTY_PRODUCT,
                ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v ?? ''])),
                problems: p.problems.map((x) => x.id),
                image_file: null,
                remove_image: false,
            })}
            rules={{
                name: [required, max(255)],
                description: [required, max(1000)],
                price: [required, positive, decimals(2)],
                stock: [required, integer, minNum(0)],
                species: [required],
                package_weight: [integer, minNum(1)],
                kcal_per_100g: [integer, minNum(1)],
                ingredients: [max(255)],
                image: [max(255)],
                category_id: [required],
                brand_id: [required],
            }}
            toBody={(f) => {
                const fd = new FormData();
                ['name', 'description', 'price', 'stock', 'species', 'age_group', 'package_weight', 'kcal_per_100g', 'ingredients', 'category_id', 'brand_id'].forEach((k) => fd.append(k, f[k] ?? ''));
                fd.set('price', String(f.price).replace(',', '.'));
                fd.append('image', f.image ?? '');
                fd.append('remove_image', f.remove_image ? '1' : '0');
                if (f.image_file) fd.append('image_file', f.image_file);
                f.problems.forEach((id) => fd.append('problems[]', id));
                return fd;
            }}
            deleteTitle={(p) => t('admin.deleteProduct', { name: p.name })}
            renderForm={(f, set, errors, setForm) => (
                <>
                    <Field label={`${t('attr.name')} *`} error={errors.name}>
                        <input className="input" maxLength={255} value={f.name} onChange={set('name')} />
                    </Field>
                    <Field label={`${t('attr.description')} *`} error={errors.description} hint={`${f.description.length}/1000`}>
                        <textarea className="input" rows={3} maxLength={1000} value={f.description} onChange={set('description')} />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Field label={`${t('attr.price')}, € *`} error={errors.price}>
                            <input className="input" type="number" step="0.01" min="0.01" value={f.price} onChange={set('price')} />
                        </Field>
                        <Field label={`${t('attr.stock')} *`} error={errors.stock}>
                            <input className="input" type="number" min="0" step="1" value={f.stock} onChange={set('stock')} />
                        </Field>
                        <Field label={`${t('attr.species')} *`} error={errors.species}>
                            <select className="input" value={f.species} onChange={set('species')}>
                                {speciesOptions().map(([k, l]) => (
                                    <option key={k} value={k}>
                                        {l}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label={`${t('attr.category_id')} *`} error={errors.category_id}>
                            <select className="input" value={f.category_id} onChange={set('category_id')}>
                                <option value="">—</option>
                                {meta.categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.icon} {c.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label={`${t('attr.brand_id')} *`} error={errors.brand_id}>
                            <select className="input" value={f.brand_id} onChange={set('brand_id')}>
                                <option value="">—</option>
                                {meta.brands.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label={t('attr.age_group')} error={errors.age_group}>
                            <select className="input" value={f.age_group} onChange={set('age_group')}>
                                {['visi', 'jauns', 'pieaugušais', 'seniors'].map((a) => (
                                    <option key={a} value={a}>
                                        {t(`admin.age.${a}`)}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label={`${t('attr.package_weight')}, g`} error={errors.package_weight} hint={t('admin.packageHint')}>
                            <input className="input" type="number" min="1" step="1" value={f.package_weight} onChange={set('package_weight')} />
                        </Field>
                        <Field label={t('attr.kcal_per_100g')} error={errors.kcal_per_100g}>
                            <input className="input" type="number" min="1" step="1" value={f.kcal_per_100g} onChange={set('kcal_per_100g')} />
                        </Field>
                        <Field label={t('attr.ingredients')} error={errors.ingredients}>
                            <input className="input" maxLength={255} value={f.ingredients} onChange={set('ingredients')} placeholder="jērs, rīsi" />
                        </Field>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
                        <span className="grid size-20 place-items-center overflow-hidden rounded-xl bg-brand-50 text-4xl">
                            {f.image_file ? <img src={URL.createObjectURL(f.image_file)} alt="" className="size-full object-cover" /> : !f.remove_image && isImagePath(f.image) ? <img src={imageUrl(f.image)} alt="" className="size-full object-cover" /> : <ProductImage product={{ image: isImagePath(f.image) ? '📦' : f.image }} />}
                        </span>
                        <div className="space-y-2">
                            <Field label={t('admin.imageFile')} error={errors.image_file} hint={t('admin.imageHint')}>
                                <input className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setForm((x) => ({ ...x, image_file: e.target.files[0] || null }))} />
                            </Field>
                            {!isImagePath(f.image) || f.remove_image ? (
                                <Field label={t('admin.emoji')} error={errors.image}>
                                    <input className="input w-24" maxLength={10} value={isImagePath(f.image) ? '' : f.image} onChange={(e) => setForm((x) => ({ ...x, image: e.target.value }))} />
                                </Field>
                            ) : (
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" className="accent-brand-500" checked={f.remove_image} onChange={set('remove_image')} />
                                    {t('admin.removeImage')}
                                </label>
                            )}
                        </div>
                    </div>
                    <CheckList label={t('admin.problemsLinked')} items={meta.problems} value={f.problems} onChange={(v) => setForm((x) => ({ ...x, problems: v }))} />
                </>
            )}
        />
    );
}

export function CategoriesAdmin() {
    const { t } = useI18n();
    return (
        <CrudPage
            endpoint="/admin/categories"
            title={t('admin.categories')}
            newLabel={t('admin.newCategory')}
            columns={[
                { label: t('attr.icon'), render: (c) => <span className="text-2xl">{c.icon}</span> },
                { label: t('attr.name'), render: (c) => <b>{c.name}</b> },
                { label: t('attr.slug'), render: (c) => <code className="text-xs">{c.slug}</code> },
                { label: t('admin.productsCount'), className: 'text-right', render: (c) => c.products_count },
            ]}
            empty={{ name: '', slug: '', icon: '' }}
            toForm={(c) => ({ name: c.name, slug: c.slug, icon: c.icon || '' })}
            rules={{ name: [required, max(100)], slug: [required, max(100)], icon: [max(10)] }}
            deleteTitle={(c) => t('admin.deleteCategory', { name: c.name })}
            renderForm={(f, set, errors) => (
                <>
                    <Field label={`${t('attr.name')} *`} error={errors.name}>
                        <input className="input" maxLength={100} value={f.name} onChange={set('name')} />
                    </Field>
                    <Field label={`${t('attr.slug')} *`} error={errors.slug} hint={t('admin.slugHint')}>
                        <input className="input" maxLength={100} value={f.slug} onChange={set('slug')} />
                    </Field>
                    <Field label={t('attr.icon')} error={errors.icon}>
                        <input className="input w-24" maxLength={10} value={f.icon} onChange={set('icon')} />
                    </Field>
                </>
            )}
        />
    );
}

export function BrandsAdmin() {
    const { t } = useI18n();
    return (
        <CrudPage
            endpoint="/admin/brands"
            title={t('admin.brands')}
            newLabel={t('admin.newBrand')}
            columns={[
                { label: t('attr.name'), render: (b) => <b>{b.name}</b> },
                { label: t('admin.productsCount'), className: 'text-right', render: (b) => b.products_count },
            ]}
            empty={{ name: '' }}
            toForm={(b) => ({ name: b.name })}
            rules={{ name: [required, max(100)] }}
            deleteTitle={(b) => t('admin.deleteBrand', { name: b.name })}
            renderForm={(f, set, errors) => (
                <Field label={`${t('attr.name')} *`} error={errors.name}>
                    <input className="input" maxLength={100} value={f.name} onChange={set('name')} />
                </Field>
            )}
        />
    );
}

export function ProblemsAdmin() {
    const { t } = useI18n();
    const [products, setProducts] = useState([]);
    useEffect(() => {
        api('/products', { params: { per_page: 100 } })
            .then((r) => setProducts(r.data))
            .catch(() => {});
    }, []);

    return (
        <CrudPage
            endpoint="/admin/problems"
            title={t('admin.problems')}
            newLabel={t('admin.newProblem')}
            modalSize="max-w-2xl"
            columns={[
                { label: t('attr.name'), render: (p) => <b>{p.name}</b> },
                { label: t('attr.keywords'), render: (p) => <span className="line-clamp-2 text-xs text-ink/60">{p.keywords}</span> },
                { label: t('admin.productsCount'), className: 'text-right', render: (p) => p.products.length },
            ]}
            empty={{ name: '', keywords: '', advice: '', products: [] }}
            toForm={(p) => ({ name: p.name, keywords: p.keywords, advice: p.advice || '', products: p.products.map((x) => x.id) })}
            rules={{ name: [required, max(100)], keywords: [required, max(2000)], advice: [max(2000)] }}
            deleteTitle={(p) => t('admin.deleteProblem', { name: p.name })}
            renderForm={(f, set, errors, setForm) => (
                <>
                    <Field label={`${t('attr.name')} *`} error={errors.name}>
                        <input className="input" maxLength={100} value={f.name} onChange={set('name')} />
                    </Field>
                    <Field label={`${t('attr.keywords')} *`} error={errors.keywords} hint={t('admin.keywordsHint')}>
                        <textarea className="input" rows={3} maxLength={2000} value={f.keywords} onChange={set('keywords')} />
                    </Field>
                    <Field label={t('attr.advice')} error={errors.advice}>
                        <textarea className="input" rows={3} maxLength={2000} value={f.advice} onChange={set('advice')} />
                    </Field>
                    <CheckList label={t('admin.productsLinked')} items={products} value={f.products} onChange={(v) => setForm((x) => ({ ...x, products: v }))} />
                </>
            )}
        />
    );
}

export function ArticlesAdmin() {
    const { t } = useI18n();
    return (
        <CrudPage
            endpoint="/admin/articles"
            title={t('admin.articles')}
            newLabel={t('admin.newArticle')}
            modalSize="max-w-2xl"
            filters={[{ key: 'species', label: t('attr.species'), options: speciesOptions() }]}
            columns={[
                { label: t('attr.title'), render: (a) => <b className="line-clamp-2">{a.title}</b> },
                { label: t('attr.species'), render: (a) => `${SPECIES[a.species]?.icon} ${SPECIES[a.species]?.label}` },
                {
                    label: t('attr.published_at'),
                    render: (a) => (
                        <span className={a.published_at > today() ? 'text-amber-700' : ''}>
                            {fmtDate(a.published_at)} {a.published_at > today() && `(${t('admin.scheduled')})`}
                        </span>
                    ),
                },
            ]}
            empty={{ title: '', excerpt: '', content: '', species: 'suns', published_at: today() }}
            toForm={(a) => ({ title: a.title, excerpt: a.excerpt, content: a.content, species: a.species, published_at: a.published_at })}
            rules={{ title: [required, max(255)], excerpt: [required, max(300)], content: [required, max(20000)], species: [required], published_at: [required] }}
            deleteTitle={(a) => t('admin.deleteArticle', { name: a.title })}
            renderForm={(f, set, errors) => (
                <>
                    <Field label={`${t('attr.title')} *`} error={errors.title}>
                        <input className="input" maxLength={255} value={f.title} onChange={set('title')} />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label={`${t('attr.species')} *`} error={errors.species}>
                            <select className="input" value={f.species} onChange={set('species')}>
                                {speciesOptions().map(([k, l]) => (
                                    <option key={k} value={k}>
                                        {l}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label={`${t('attr.published_at')} *`} error={errors.published_at}>
                            <input className="input" type="date" value={f.published_at} onChange={set('published_at')} />
                        </Field>
                    </div>
                    <Field label={`${t('attr.excerpt')} *`} error={errors.excerpt} hint={`${f.excerpt.length}/300`}>
                        <textarea className="input" rows={2} maxLength={300} value={f.excerpt} onChange={set('excerpt')} />
                    </Field>
                    <Field label={`${t('attr.content')} *`} error={errors.content} hint={t('admin.contentHint')}>
                        <textarea className="input" rows={10} maxLength={20000} value={f.content} onChange={set('content')} />
                    </Field>
                </>
            )}
        />
    );
}

import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../../lang';
import { api, fieldErrors } from '../../lib/api';
import { useStore } from '../../lib/store';
import { validate } from '../../lib/validate';
import { useConfirm } from '../ConfirmDialog';
import { Loading } from '../Guards';
import { FormActions, Modal } from '../Modal';

export function Pager({ page, onPage }) {
    const { t } = useI18n();
    if (!page || page.last_page <= 1) return null;
    return (
        <nav className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm" aria-label={t('admin.pagination')}>
            <button className="btn-ghost px-3 py-1.5" disabled={page.current_page <= 1} onClick={() => onPage(page.current_page - 1)}>
                {t('common.prev')}
            </button>
            <span className="px-2 text-ink/60">{t('common.page', { page: page.current_page, last: page.last_page })}</span>
            <button className="btn-ghost px-3 py-1.5" disabled={page.current_page >= page.last_page} onClick={() => onPage(page.current_page + 1)}>
                {t('common.next')}
            </button>
        </nav>
    );
}

/**
 * Universāla administrēšanas tabula: meklēšana + filtri, lappuses, izveides/rediģēšanas
 * modālais logs ar validāciju un dzēšanas apstiprinājums.
 */
export default function CrudPage({ endpoint, title, newLabel, columns, filters = [], empty, toForm, rules = {}, renderForm, toBody, deleteTitle, canCreate = true, canEdit = true, canDelete = true, modalSize }) {
    const { t } = useI18n();
    const { notify } = useStore();
    const confirm = useConfirm();
    const [query, setQuery] = useState({ q: '', page: 1, ...Object.fromEntries(filters.map((f) => [f.key, ''])) });
    const [data, setData] = useState(null);
    const [form, setForm] = useState(null);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== ''));
        return api(endpoint, { params })
            .then(setData)
            .catch((e) => notify(e.message, 'error'));
    }, [endpoint, query, notify]);

    // Meklēšana ar 300 ms aizturi
    useEffect(() => {
        const timer = setTimeout(load, query.q ? 300 : 0);
        return () => clearTimeout(timer);
    }, [load, query.q]);

    const replace = (row) => setData((d) => ({ ...d, data: d.data.map((r) => (r.id === row.id ? row : r)) }));
    const setQ = (k) => (e) => setQuery((q) => ({ ...q, [k]: e.target.value, page: 1 }));
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

    const open = (row) => {
        setErrors({});
        setForm(row ? { ...toForm(row), id: row.id } : { ...empty });
    };

    const submit = async (e) => {
        e.preventDefault();
        const errs = validate(form, typeof rules === 'function' ? rules(form) : rules);
        setErrors(errs);
        if (Object.keys(errs).length) return notify(t('common.checkForm'), 'error');
        setBusy(true);
        try {
            const body = toBody ? toBody(form) : form;
            if (form.id && body instanceof FormData) {
                body.append('_method', 'PUT');
                await api(`${endpoint}/${form.id}`, { method: 'POST', body });
            } else if (form.id) await api(`${endpoint}/${form.id}`, { method: 'PUT', body });
            else await api(endpoint, { method: 'POST', body });
            notify(form.id ? t('common.updated') : t('common.created'));
            setForm(null);
            load();
        } catch (err) {
            setErrors(fieldErrors(err));
            notify(err.message, 'error');
        } finally {
            setBusy(false);
        }
    };

    const remove = async (row) => {
        if (!(await confirm({ title: deleteTitle(row) }))) return;
        try {
            await api(`${endpoint}/${row.id}`, { method: 'DELETE' });
            notify(t('common.deleted'));
            load();
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-extrabold">{title}</h2>
                {canCreate && (
                    <button className="btn-primary" onClick={() => open(null)}>
                        + {newLabel}
                    </button>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <input type="search" className="input max-w-xs flex-1" aria-label={t('common.search')} placeholder={`${t('common.search')}…`} value={query.q} onChange={setQ('q')} maxLength={100} />
                {filters.map((f) => (
                    <select key={f.key} className="input w-auto" aria-label={f.label} value={query[f.key]} onChange={setQ(f.key)}>
                        <option value="">{f.label}: {t('common.all')}</option>
                        {f.options.map(([v, l]) => (
                            <option key={v} value={v}>
                                {l}
                            </option>
                        ))}
                    </select>
                ))}
            </div>

            {!data ? (
                <Loading />
            ) : (
                <>
                    <div className="card mt-4 overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead className="border-b border-black/5 text-xs tracking-wide text-ink/50 uppercase">
                                <tr>
                                    {columns.map((c) => (
                                        <th key={c.label} scope="col" className={`px-4 py-3 font-bold ${c.className || ''}`}>
                                            {c.label}
                                        </th>
                                    ))}
                                    {(canEdit || canDelete) && (
                                        <th scope="col" className="px-4 py-3 text-right font-bold">
                                            {t('common.actions')}
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {data.data.map((row) => (
                                    <tr key={row.id} className="align-middle hover:bg-black/[0.02]">
                                        {columns.map((c) => (
                                            <td key={c.label} className={`px-4 py-3 ${c.className || ''}`}>
                                                {c.render(row, { replace, reload: load })}
                                            </td>
                                        ))}
                                        {(canEdit || canDelete) && (
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                {canEdit && (
                                                    <button className="rounded-lg px-2 py-1 font-semibold text-brand-700 hover:bg-brand-50" onClick={() => open(row)}>
                                                        {t('common.edit')}
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button className="rounded-lg px-2 py-1 font-semibold text-red-600 hover:bg-red-50" onClick={() => remove(row)}>
                                                        {t('common.delete')}
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {data.data.length === 0 && (
                                    <tr>
                                        <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-ink/60">
                                            {t('admin.noRecords')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-2 text-xs text-ink/50">{t('admin.total', { n: data.total })}</p>
                    <Pager page={data} onPage={(p) => setQuery((q) => ({ ...q, page: p }))} />
                </>
            )}

            {form && renderForm && (
                <Modal title={form.id ? `${t('common.edit')}: ${title}` : newLabel} onClose={() => setForm(null)} size={modalSize}>
                    <form onSubmit={submit} noValidate className="space-y-3">
                        {renderForm(form, set, errors, setForm)}
                        <FormActions onCancel={() => setForm(null)} busy={busy} />
                    </form>
                </Modal>
            )}
        </div>
    );
}

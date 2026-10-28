import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useConfirm } from '../components/ConfirmDialog';
import { Field, FormActions, Modal } from '../components/Modal';
import { useI18n } from '../lang';
import { ageLabel, fieldErrors, fmtDate, SPECIES, today } from '../lib/api';
import { useStore } from '../lib/store';
import { decimals, max, maxNum, notFuture, positive, required, validate } from '../lib/validate';

const EMPTY = { name: '', species: 'suns', breed: '', birth_date: '', weight: '', allergies: '', activity: 'normal' };
const PET_RULES = {
    name: [required, max(50)],
    species: [required],
    breed: [max(50)],
    birth_date: [notFuture],
    weight: [required, positive, decimals(2), maxNum(999.99)],
    allergies: [max(255)],
};
const REMINDER_TYPES = ['vakcinācija', 'pretparazītu', 'vizīte'];
const REMINDER_ICONS = { vakcinācija: '💉', pretparazītu: '🐛', vizīte: '🩺' };

export function daysUntil(date) {
    const [y, m, d] = String(date).slice(0, 10).split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.round((target - now) / 86400000);
}

export default function Pets({ embedded = false }) {
    const { t } = useI18n();
    const { pets, upcoming, savePet, deletePet, notify, activePet, setActivePetId } = useStore();
    const confirm = useConfirm();
    const [form, setForm] = useState(null);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [reminderPetId, setReminderPetId] = useState(null);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        const errs = validate(form, PET_RULES);
        setErrors(errs);
        if (Object.keys(errs).length) return notify(t('common.checkForm'), 'error');
        setBusy(true);
        try {
            await savePet({ ...form, weight: String(form.weight).replace(',', '.'), birth_date: form.birth_date || null });
            notify(form.id ? t('pets.updated') : t('pets.created'));
            setForm(null);
        } catch (err) {
            setErrors(fieldErrors(err));
            notify(err.message, 'error');
        } finally {
            setBusy(false);
        }
    };

    const remove = async (p) => {
        if (!(await confirm({ title: t('pets.deleteConfirm', { name: p.name }) }))) return;
        try {
            await deletePet(p.id);
            notify(t('pets.deleted'));
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    const open = (p) => {
        setErrors({});
        setForm(p ? { ...EMPTY, ...p, breed: p.breed || '', allergies: p.allergies || '', birth_date: p.birth_date || '' } : EMPTY);
    };

    const reminderPet = pets.find((p) => p.id === reminderPetId);

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                {embedded ? <h2 className="text-xl font-extrabold">{t('pets.title')}</h2> : <h1 className="text-3xl font-extrabold">{t('pets.title')}</h1>}
                <button className="btn-primary" onClick={() => open(null)}>
                    + {t('pets.add')}
                </button>
            </div>

            {upcoming.length > 0 && (
                <div className="mt-6 space-y-2">
                    <p className="text-sm font-bold text-ink/60">{t('reminders.upcomingTitle')}</p>
                    {upcoming.map((r) => (
                        <div key={r.id} className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-amber-900">
                            <span className="text-2xl">🔔</span>
                            <span>
                                <b>{r.pet?.name}</b>: {t(`reminders.types.${r.type}`)} — {fmtDate(r.date)} ({daysUntil(r.date) === 0 ? t('reminders.today') : t('reminders.inDays', { n: daysUntil(r.date) })})
                                {r.description && <span className="text-amber-800/70"> · {r.description}</span>}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pets.map((p) => (
                    <div key={p.id} className={`card flex flex-col p-5 ${activePet?.id === p.id ? 'ring-2 ring-brand-500' : ''}`}>
                        <div className="flex items-center gap-3">
                            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-3xl">{SPECIES[p.species]?.icon}</span>
                            <div className="min-w-0">
                                <h3 className="truncate text-lg font-extrabold">{p.name}</h3>
                                <p className="text-sm text-ink/60">
                                    {SPECIES[p.species]?.label}
                                    {p.breed && `, ${p.breed}`} · {ageLabel(p.birth_date)} · {Number(p.weight).toFixed(2).replace('.', ',')} kg
                                </p>
                            </div>
                        </div>
                        {p.allergies && <p className="mt-3 chip w-fit bg-red-50 text-red-700">{t('pets.allergy', { list: p.allergies })}</p>}
                        <ul className="mt-3 space-y-1 text-sm">
                            {p.reminders.map((r) => (
                                <li key={r.id}>
                                    {REMINDER_ICONS[r.type]} {t(`reminders.types.${r.type}`)}: {fmtDate(r.date)}
                                </li>
                            ))}
                            {p.reminders.length === 0 && <li className="text-ink/50">{t('reminders.noneForPet')}</li>}
                        </ul>
                        <div className="mt-auto flex flex-wrap gap-2 pt-4">
                            <button className="btn-primary px-3 py-2 text-sm" onClick={() => setActivePetId(activePet?.id === p.id ? null : p.id)}>
                                {activePet?.id === p.id ? `✓ ${t('pets.active')}` : t('pets.choose')}
                            </button>
                            <Link to="/katalogs" onClick={() => setActivePetId(p.id)} className="btn-ghost px-3 py-2 text-sm">
                                {t('pets.products')}
                            </Link>
                            <Link to={`/kalkulators?pet=${p.id}`} className="btn-ghost px-3 py-2 text-sm">
                                ⚖️
                            </Link>
                            <button className="btn-ghost px-3 py-2 text-sm" onClick={() => setReminderPetId(p.id)}>
                                🔔 {t('reminders.title')}
                            </button>
                            <button className="btn-ghost px-3 py-2 text-sm" onClick={() => open(p)}>
                                {t('common.edit')}
                            </button>
                            <button className="btn-ghost px-3 py-2 text-sm text-red-600" onClick={() => remove(p)}>
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                ))}
                {pets.length === 0 && <p className="text-ink/60">{t('pets.empty')}</p>}
            </div>

            {form && (
                <Modal title={form.id ? t('pets.editTitle') : t('pets.newTitle')} onClose={() => setForm(null)}>
                    <form onSubmit={submit} className="space-y-3" noValidate>
                        <Field label={`${t('attr.name')} *`} error={errors.name}>
                            <input className="input" maxLength={50} value={form.name} onChange={set('name')} placeholder="Reksis" />
                        </Field>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label={`${t('attr.species')} *`} error={errors.species}>
                                <select className="input" value={form.species} onChange={set('species')}>
                                    {Object.entries(SPECIES).map(([k, s]) => (
                                        <option key={k} value={k}>
                                            {s.icon} {s.label}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label={t('attr.breed')} error={errors.breed}>
                                <input className="input" maxLength={50} value={form.breed} onChange={set('breed')} placeholder="bīgls" />
                            </Field>
                            <Field label={t('attr.birth_date')} error={errors.birth_date}>
                                <input className="input" type="date" max={today()} value={form.birth_date} onChange={set('birth_date')} />
                            </Field>
                            <Field label={`${t('attr.weight')}, kg *`} error={errors.weight}>
                                <input className="input" type="number" inputMode="decimal" step="0.01" min="0.01" max="999.99" value={form.weight} onChange={set('weight')} placeholder="12.50" />
                            </Field>
                        </div>
                        <Field label={t('attr.allergies')} error={errors.allergies} hint={t('pets.allergiesHint')}>
                            <input className="input" maxLength={255} value={form.allergies} onChange={set('allergies')} placeholder="vista, kvieši" />
                        </Field>
                        <Field label={t('attr.activity')}>
                            <select className="input" value={form.activity} onChange={set('activity')}>
                                {['low', 'normal', 'high'].map((a) => (
                                    <option key={a} value={a}>
                                        {t(`pets.activity.${a}`)}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <FormActions onCancel={() => setForm(null)} busy={busy} />
                    </form>
                </Modal>
            )}

            {reminderPet && <RemindersModal pet={reminderPet} onClose={() => setReminderPetId(null)} />}
        </div>
    );
}

/** Mīluļa atgādinājumu pārvaldība (CRUD). */
function RemindersModal({ pet, onClose }) {
    const { t } = useI18n();
    const { saveReminder, deleteReminder, notify } = useStore();
    const confirm = useConfirm();
    const empty = { type: 'vakcinācija', date: '', description: '' };
    const [form, setForm] = useState(empty);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        const errs = validate(form, { type: [required], date: [required], description: [max(255)] });
        setErrors(errs);
        if (Object.keys(errs).length) return;
        setBusy(true);
        try {
            await saveReminder(pet.id, form);
            notify(form.id ? t('reminders.updated') : t('reminders.created'));
            setForm(empty);
        } catch (err) {
            setErrors(fieldErrors(err));
            notify(err.message, 'error');
        } finally {
            setBusy(false);
        }
    };

    const remove = async (r) => {
        if (!(await confirm({ title: t('reminders.deleteConfirm') }))) return;
        try {
            await deleteReminder(r.id);
            notify(t('reminders.deleted'));
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    return (
        <Modal title={`🔔 ${t('reminders.title')}: ${pet.name}`} onClose={onClose}>
            <ul className="space-y-2">
                {pet.reminders.map((r) => (
                    <li key={r.id} className="flex items-center gap-2 rounded-xl border border-black/5 px-3 py-2 text-sm">
                        <span className="min-w-0 flex-1">
                            {REMINDER_ICONS[r.type]} <b>{t(`reminders.types.${r.type}`)}</b> — {fmtDate(r.date)}
                            {r.description && <span className="block truncate text-ink/60">{r.description}</span>}
                        </span>
                        <button className="rounded-lg px-2 py-1 hover:bg-black/5" onClick={() => setForm({ ...r, description: r.description || '' })} aria-label={t('common.edit')}>
                            ✏️
                        </button>
                        <button className="rounded-lg px-2 py-1 text-red-600 hover:bg-black/5" onClick={() => remove(r)} aria-label={t('common.delete')}>
                            ✕
                        </button>
                    </li>
                ))}
                {pet.reminders.length === 0 && <li className="text-sm text-ink/60">{t('reminders.noneForPet')}</li>}
            </ul>

            <form onSubmit={submit} noValidate className="mt-5 space-y-3 border-t border-black/5 pt-4">
                <p className="font-bold">{form.id ? t('reminders.editTitle') : t('reminders.newTitle')}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label={`${t('attr.type')} *`} error={errors.type}>
                        <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                            {REMINDER_TYPES.map((k) => (
                                <option key={k} value={k}>
                                    {t(`reminders.types.${k}`)}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label={`${t('attr.date')} *`} error={errors.date}>
                        <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                    </Field>
                </div>
                <Field label={t('attr.description')} error={errors.description}>
                    <input className="input" maxLength={255} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </Field>
                <FormActions onCancel={form.id ? () => setForm(empty) : onClose} busy={busy} submitLabel={form.id ? t('common.save') : t('common.add')} />
            </form>
        </Modal>
    );
}

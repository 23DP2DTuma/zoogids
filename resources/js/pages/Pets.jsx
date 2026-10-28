import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ageLabel, fmtDate, SPECIES } from '../lib/api';
import { useStore } from '../lib/store';

const EMPTY = { name: '', species: 'suns', breed: '', birthdate: '', weight: '', allergies: '', activity: 'normal', reminders: [] };

function validate(p) {
    const e = {};
    if (!p.name.trim()) e.name = 'Vārds ir obligāts.';
    else if (p.name.length > 50) e.name = 'Vārds nedrīkst būt garāks par 50 simboliem.';
    if (p.breed.length > 50) e.breed = 'Šķirne — līdz 50 simboliem.';
    if (p.birthdate && new Date(p.birthdate) > new Date()) e.birthdate = 'Dzimšanas datums nedrīkst būt nākotnē.';
    if (!(Number(p.weight) > 0)) e.weight = 'Svaram jābūt pozitīvam skaitlim.';
    if (p.allergies.length > 255) e.allergies = 'Alerģijas — līdz 255 simboliem.';
    return e;
}

function daysUntil(date) {
    return Math.ceil((new Date(date) - new Date()) / 86400000);
}

export default function Pets() {
    const { pets, savePet, deletePet, notify, activePet, setActivePetId } = useStore();
    const [form, setForm] = useState(null);
    const [errors, setErrors] = useState({});
    const [confirm, setConfirm] = useState(null);
    const [reminder, setReminder] = useState({ type: 'Vakcinācija', date: '' });

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = (e) => {
        e.preventDefault();
        const errs = validate(form);
        setErrors(errs);
        if (Object.keys(errs).length) {
            notify('Pārbaudiet ievadītos datus', 'error');
            return;
        }
        savePet({ ...form, weight: Math.round(Number(form.weight) * 100) / 100 });
        notify(form.id ? 'Mīluļa profils atjaunināts' : 'Mīlulis pievienots');
        setForm(null);
    };

    const addReminder = () => {
        if (!reminder.date) return;
        setForm((f) => ({ ...f, reminders: [...(f.reminders || []), { id: String(Date.now()), ...reminder }] }));
        setReminder({ type: 'Vakcinācija', date: '' });
    };

    const upcoming = pets.flatMap((p) => (p.reminders || []).map((r) => ({ ...r, pet: p }))).filter((r) => daysUntil(r.date) >= 0 && daysUntil(r.date) <= 30);

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-3xl font-extrabold">Mani mīluļi</h1>
                <button
                    className="btn-primary"
                    onClick={() => {
                        setForm(EMPTY);
                        setErrors({});
                    }}
                >
                    + Pievienot mīluli
                </button>
            </div>

            {upcoming.length > 0 && (
                <div className="mt-6 space-y-2">
                    {upcoming.map((r) => (
                        <div key={r.id} className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-amber-900">
                            <span className="text-2xl">🔔</span>
                            <span>
                                <b>{r.pet.name}</b>: {r.type} — {fmtDate(r.date)} (pēc {daysUntil(r.date)} d.)
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pets.map((p) => (
                    <div key={p.id} className={`card p-5 ${activePet?.id === p.id ? 'ring-2 ring-brand-500' : ''}`}>
                        <div className="flex items-center gap-3">
                            <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-3xl">{SPECIES[p.species].icon}</span>
                            <div>
                                <h3 className="text-lg font-extrabold">{p.name}</h3>
                                <p className="text-sm text-ink/60">
                                    {SPECIES[p.species].label}
                                    {p.breed && `, ${p.breed}`} · {ageLabel(p.birthdate)} · {p.weight} kg
                                </p>
                            </div>
                        </div>
                        {p.allergies && <p className="mt-3 chip bg-red-50 text-red-700">Alerģija: {p.allergies}</p>}
                        <ul className="mt-3 space-y-1 text-sm">
                            {(p.reminders || []).map((r) => (
                                <li key={r.id}>
                                    🔔 {r.type}: {fmtDate(r.date)}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button className="btn-primary px-3 py-2 text-sm" onClick={() => setActivePetId(p.id)}>
                                {activePet?.id === p.id ? '✓ Aktīvs' : 'Izvēlēties'}
                            </button>
                            <Link to="/katalogs" onClick={() => setActivePetId(p.id)} className="btn-ghost px-3 py-2 text-sm">
                                Preces
                            </Link>
                            <button
                                className="btn-ghost px-3 py-2 text-sm"
                                onClick={() => {
                                    setForm({ ...EMPTY, ...p });
                                    setErrors({});
                                }}
                            >
                                Rediģēt
                            </button>
                            <button className="btn-ghost px-3 py-2 text-sm text-red-600" onClick={() => setConfirm(p)}>
                                Dzēst
                            </button>
                        </div>
                    </div>
                ))}
                {pets.length === 0 && <p className="text-ink/60">Vēl nav neviena mīluļa. Pievienojiet pirmo!</p>}
            </div>

            {form && (
                <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-black/40 p-4" onClick={() => setForm(null)}>
                    <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="card w-full max-w-lg space-y-3 p-6" noValidate>
                        <h2 className="text-xl font-extrabold">{form.id ? 'Rediģēt mīluli' : 'Jauns mīlulis'}</h2>
                        <Field label="Vārds *" error={errors.name}>
                            <input className="input" value={form.name} onChange={set('name')} placeholder="Reksis" />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Suga *">
                                <select className="input" value={form.species} onChange={set('species')}>
                                    {Object.entries(SPECIES).map(([k, s]) => (
                                        <option key={k} value={k}>
                                            {s.icon} {s.label}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Šķirne" error={errors.breed}>
                                <input className="input" value={form.breed} onChange={set('breed')} placeholder="bīgls" />
                            </Field>
                            <Field label="Dzimšanas datums" error={errors.birthdate}>
                                <input className="input" type="date" max={new Date().toISOString().slice(0, 10)} value={form.birthdate} onChange={set('birthdate')} />
                            </Field>
                            <Field label="Svars, kg *" error={errors.weight}>
                                <input className="input" type="number" step="0.01" min="0.01" value={form.weight} onChange={set('weight')} placeholder="12.50" />
                            </Field>
                        </div>
                        <Field label="Alerģijas" error={errors.allergies}>
                            <input className="input" value={form.allergies} onChange={set('allergies')} placeholder="vista" />
                        </Field>
                        <Field label="Aktivitāte">
                            <select className="input" value={form.activity} onChange={set('activity')}>
                                <option value="low">Zema</option>
                                <option value="normal">Vidēja</option>
                                <option value="high">Augsta</option>
                            </select>
                        </Field>
                        <div>
                            <label className="label">Atgādinājumi</label>
                            <ul className="mb-2 space-y-1 text-sm">
                                {form.reminders?.map((r) => (
                                    <li key={r.id} className="flex justify-between">
                                        <span>
                                            🔔 {r.type}: {fmtDate(r.date)}
                                        </span>
                                        <button type="button" className="text-red-600" onClick={() => setForm((f) => ({ ...f, reminders: f.reminders.filter((x) => x.id !== r.id) }))}>
                                            ✕
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex gap-2">
                                <select className="input" value={reminder.type} onChange={(e) => setReminder((r) => ({ ...r, type: e.target.value }))}>
                                    <option>Vakcinācija</option>
                                    <option>Pretparazītu līdzeklis</option>
                                    <option>Veterinārārsta vizīte</option>
                                </select>
                                <input className="input" type="date" value={reminder.date} onChange={(e) => setReminder((r) => ({ ...r, date: e.target.value }))} />
                                <button type="button" className="btn-ghost" onClick={addReminder}>
                                    +
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" className="btn-ghost" onClick={() => setForm(null)}>
                                Atcelt
                            </button>
                            <button className="btn-primary">Saglabāt</button>
                        </div>
                    </form>
                </div>
            )}

            {confirm && (
                <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
                    <div className="card w-full max-w-sm p-6 text-center">
                        <div className="text-4xl">🗑️</div>
                        <p className="mt-3 font-bold">Vai tiešām dzēst {confirm.name} profilu?</p>
                        <p className="mt-1 text-sm text-ink/60">Šo darbību nevar atsaukt.</p>
                        <div className="mt-5 flex justify-center gap-2">
                            <button className="btn-ghost" onClick={() => setConfirm(null)}>
                                Atcelt
                            </button>
                            <button
                                className="btn bg-red-600 text-white hover:bg-red-700"
                                onClick={() => {
                                    deletePet(confirm.id);
                                    notify('Mīluļa profils dzēsts');
                                    setConfirm(null);
                                }}
                            >
                                Dzēst
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, error, children }) {
    return (
        <div>
            <label className="label">{label}</label>
            {children}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}

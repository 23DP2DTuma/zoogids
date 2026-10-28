import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ageMonths } from './api';

// Prototipā mīluļi un grozs glabājas pārlūkā (localStorage).
// Pilnajā versijā tie būs saistīti ar lietotāja kontu (tabulas "Mīluļi", "Grozi").
const StoreContext = createContext(null);

function usePersisted(key, initial) {
    const [value, setValue] = useState(() => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : initial;
        } catch {
            return initial;
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            /* ignore */
        }
    }, [key, value]);
    return [value, setValue];
}

const DEMO_PETS = [
    { id: 'p1', name: 'Reksis', species: 'suns', breed: 'bīgls', birthdate: '2023-03-14', weight: 12.5, allergies: 'vista', activity: 'normal', reminders: [{ id: 'r1', type: 'Pretparazītu līdzeklis', date: '2026-11-05' }, { id: 'r2', type: 'Vakcinācija', date: '2027-03-14' }] },
    { id: 'p2', name: 'Mince', species: 'kaķis', breed: '', birthdate: '2026-05-20', weight: 2.1, allergies: '', activity: 'high', reminders: [{ id: 'r3', type: 'Vakcinācija', date: '2026-11-12' }] },
];

export function StoreProvider({ children }) {
    const [pets, setPets] = usePersisted('zg_pets', DEMO_PETS);
    const [activePetId, setActivePetId] = usePersisted('zg_active_pet', null);
    const [cart, setCart] = usePersisted('zg_cart', []);
    const [toast, setToast] = useState(null);

    const notify = useCallback((text, type = 'success') => {
        setToast({ text, type, key: Date.now() });
        setTimeout(() => setToast(null), 3200);
    }, []);

    const activePet = pets.find((p) => String(p.id) === String(activePetId)) || null;

    const value = useMemo(
        () => ({
            pets,
            activePet,
            setActivePetId,
            savePet: (pet) =>
                setPets((list) => (pet.id && list.some((p) => p.id === pet.id) ? list.map((p) => (p.id === pet.id ? pet : p)) : [...list, { ...pet, id: crypto.randomUUID?.() ?? String(Date.now()), reminders: pet.reminders ?? [] }])),
            deletePet: (id) => {
                setPets((list) => list.filter((p) => p.id !== id));
                if (activePetId === id) setActivePetId(null);
            },
            cart,
            cartCount: cart.reduce((s, i) => s + i.quantity, 0),
            cartTotal: cart.reduce((s, i) => s + i.quantity * Number(i.product.price), 0),
            addToCart: (product, qty = 1) => {
                setCart((c) => {
                    const ex = c.find((i) => i.product.id === product.id);
                    if (ex) return c.map((i) => (i.product.id === product.id ? { ...i, quantity: Math.min(i.quantity + qty, product.stock) } : i));
                    return [...c, { product, quantity: qty }];
                });
                notify(`“${product.name}” pievienots grozam`);
            },
            setQty: (id, quantity) => setCart((c) => c.map((i) => (i.product.id === id ? { ...i, quantity: Math.max(1, Math.min(quantity, i.product.stock)) } : i))),
            removeFromCart: (id) => setCart((c) => c.filter((i) => i.product.id !== id)),
            clearCart: () => setCart([]),
            toast,
            notify,
        }),
        [pets, activePet, activePetId, cart, toast, notify],
    );

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);

/** Filtra parametri katalogam no mīluļa profila. */
export function petFilterParams(pet) {
    if (!pet) return {};
    return { species: pet.species, exclude: pet.allergies || '' };
}

export function petAgeGroup(pet) {
    const m = ageMonths(pet?.birthdate);
    if (m === null) return null;
    if (m < 12) return 'jauns';
    if (m >= 84) return 'seniors';
    return 'pieaugušais';
}

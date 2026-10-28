import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { t } from '../lang';
import { ageMonths, api } from './api';
import { useAuth } from './auth';

// Veikala stāvoklis: mīluļi un atgādinājumi (no API), grozs, paziņojumi (toast).
// localStorage tiek lietots tikai viesa grozam un UI iestatījumiem (aktīvais mīlulis, valoda).
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
            if (value === null || value === undefined) localStorage.removeItem(key);
            else localStorage.setItem(key, JSON.stringify(value));
        } catch {
            /* ignore */
        }
    }, [key, value]);
    return [value, setValue];
}

export function StoreProvider({ children }) {
    const { user } = useAuth();
    const [pets, setPets] = useState([]);
    const [upcoming, setUpcoming] = useState([]);
    const [activePetId, setActivePetId] = usePersisted('zg_active_pet', null);
    const [guestCart, setGuestCart] = usePersisted('zg_cart', []);
    const [serverCart, setServerCart] = useState([]);
    const [loginPrompt, setLoginPrompt] = useState(null);
    const [toast, setToast] = useState(null);
    const cart = user ? serverCart : guestCart;

    const notify = useCallback((text, type = 'success') => {
        setToast({ text, type, key: Date.now() });
        setTimeout(() => setToast((cur) => (cur && Date.now() - cur.key >= 3000 ? null : cur)), 3200);
    }, []);

    const reloadPets = useCallback(async () => {
        if (!user) return;
        const [p, u] = await Promise.all([api('/pets'), api('/reminders/upcoming')]);
        setPets(p);
        setUpcoming(u);
    }, [user]);

    useEffect(() => {
        if (user) reloadPets().catch(() => {});
        else {
            setPets([]);
            setUpcoming([]);
        }
    }, [user, reloadPets]);

    // Pēc pieteikšanās viesa grozs (localStorage) vienreiz tiek apvienots ar servera grozu un notīrīts
    useEffect(() => {
        if (!user) {
            setServerCart([]);
            return;
        }
        const pending = guestCart.map((i) => ({ product_id: i.product.id, quantity: i.quantity }));
        const request = pending.length ? api('/cart/merge', { method: 'POST', body: { items: pending } }) : api('/cart');
        request
            .then((res) => {
                setServerCart(res.items);
                if (pending.length) {
                    setGuestCart([]);
                    notify(t('cart.merged'));
                }
            })
            .catch(() => {});
    }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const activePet = pets.find((p) => String(p.id) === String(activePetId)) || null;

    const addToCart = useCallback(
        async (product, qty = 1) => {
            if (!user) {
                // Viesis: saglabājam lokāli un piedāvājam pieteikties
                setGuestCart((c) => {
                    const ex = c.find((i) => i.product.id === product.id);
                    if (ex) return c.map((i) => (i.product.id === product.id ? { ...i, quantity: Math.min(i.quantity + qty, product.stock) } : i));
                    return [...c, { product, quantity: Math.min(qty, product.stock) }];
                });
                setLoginPrompt(product);
                return;
            }
            try {
                const res = await api('/cart/items', { method: 'POST', body: { product_id: product.id, quantity: qty } });
                setServerCart(res.items);
                notify(t('cart.added', { name: product.name }));
            } catch (err) {
                notify(err.message, 'error');
            }
        },
        [user, setGuestCart, notify],
    );

    const setQty = useCallback(
        async (id, quantity) => {
            if (quantity < 1) return;
            if (!user) {
                setGuestCart((c) => c.map((i) => (i.product.id === id ? { ...i, quantity: Math.min(quantity, i.product.stock) } : i)));
                return;
            }
            try {
                setServerCart((await api(`/cart/items/${id}`, { method: 'PUT', body: { quantity } })).items);
            } catch (err) {
                notify(err.message, 'error');
            }
        },
        [user, setGuestCart, notify],
    );

    const removeFromCart = useCallback(
        async (id) => {
            if (!user) {
                setGuestCart((c) => c.filter((i) => i.product.id !== id));
                notify(t('cart.removed'));
                return;
            }
            try {
                setServerCart((await api(`/cart/items/${id}`, { method: 'DELETE' })).items);
                notify(t('cart.removed'));
            } catch (err) {
                notify(err.message, 'error');
            }
        },
        [user, setGuestCart, notify],
    );

    const savePet = useCallback(
        async (pet) => {
            const saved = pet.id ? await api(`/pets/${pet.id}`, { method: 'PUT', body: pet }) : await api('/pets', { method: 'POST', body: pet });
            await reloadPets();
            return saved;
        },
        [reloadPets],
    );

    const deletePet = useCallback(
        async (id) => {
            await api(`/pets/${id}`, { method: 'DELETE' });
            if (String(activePetId) === String(id)) setActivePetId(null);
            await reloadPets();
        },
        [activePetId, setActivePetId, reloadPets],
    );

    const saveReminder = useCallback(
        async (petId, reminder) => {
            const saved = reminder.id ? await api(`/reminders/${reminder.id}`, { method: 'PUT', body: reminder }) : await api(`/pets/${petId}/reminders`, { method: 'POST', body: reminder });
            await reloadPets();
            return saved;
        },
        [reloadPets],
    );

    const deleteReminder = useCallback(
        async (id) => {
            await api(`/reminders/${id}`, { method: 'DELETE' });
            await reloadPets();
        },
        [reloadPets],
    );

    const value = useMemo(
        () => ({
            pets,
            upcoming,
            activePet,
            setActivePetId,
            reloadPets,
            savePet,
            deletePet,
            saveReminder,
            deleteReminder,
            cart,
            cartCount: cart.reduce((s, i) => s + i.quantity, 0),
            cartTotal: cart.reduce((s, i) => s + i.quantity * Number(i.product.price), 0),
            addToCart,
            setQty,
            removeFromCart,
            clearCart: () => (user ? setServerCart([]) : setGuestCart([])),
            loginPrompt,
            closeLoginPrompt: () => setLoginPrompt(null),
            toast,
            notify,
        }),
        [pets, upcoming, activePet, setActivePetId, reloadPets, savePet, deletePet, saveReminder, deleteReminder, cart, user, setGuestCart, addToCart, setQty, removeFromCart, loginPrompt, toast, notify],
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
    const m = ageMonths(pet?.birth_date);
    if (m === null) return null;
    if (m < 12) return 'jauns';
    if (m >= 84) return 'seniors';
    return 'pieaugušais';
}

/** Vai produkta sastāvā ir kāds no mīluļa alergēniem (atdalīti ar komatu). */
export function allergenHits(pet, product) {
    if (!pet?.allergies || !product?.ingredients) return [];
    const ing = product.ingredients.toLowerCase();
    return pet.allergies
        .split(',')
        .map((a) => a.trim().toLowerCase())
        .filter((a) => a && ing.includes(a));
}

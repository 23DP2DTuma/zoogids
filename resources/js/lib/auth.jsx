import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, csrf } from './api';

// Pašreizējais lietotājs (Sanctum SPA sesija). null — viesis.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api('/user', { quiet: true })
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    // Sesija beigusies — API atgrieza 401
    useEffect(() => {
        const onUnauth = () => setUser(null);
        window.addEventListener('zg:unauthenticated', onUnauth);
        return () => window.removeEventListener('zg:unauthenticated', onUnauth);
    }, []);

    const login = useCallback(async (credentials) => {
        await csrf();
        const u = await api('/login', { method: 'POST', body: credentials });
        setUser(u);
        return u;
    }, []);

    const register = useCallback(async (data) => {
        await csrf();
        const u = await api('/register', { method: 'POST', body: data });
        setUser(u);
        return u;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api('/logout', { method: 'POST', quiet: true });
        } finally {
            setUser(null);
        }
    }, []);

    const value = useMemo(() => ({ user, setUser, loading, login, register, logout, isAdmin: user?.role === 'admin' }), [user, loading, login, register, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

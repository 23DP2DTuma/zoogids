import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useI18n } from '../lang';

/** Apstiprinājuma dialogs pirms dzēšanas u.c. neatgriezeniskām darbībām. */
export default function ConfirmDialog({ title, text, confirmLabel, danger = true, onConfirm, onCancel }) {
    const { t } = useI18n();
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={onCancel}>
            <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={(e) => e.stopPropagation()} className="card w-full max-w-sm p-6 text-center">
                <div className="text-4xl">{danger ? '🗑️' : '❓'}</div>
                <p id="confirm-title" className="mt-3 font-bold">
                    {title}
                </p>
                <p className="mt-1 text-sm text-ink/60">{text ?? t('confirm.irreversible')}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <button className="btn-ghost" onClick={onCancel} autoFocus>
                        {t('common.cancel')}
                    </button>
                    <button className={danger ? 'btn bg-red-600 text-white hover:bg-red-700' : 'btn-primary'} onClick={onConfirm}>
                        {confirmLabel ?? t('common.delete')}
                    </button>
                </div>
            </div>
        </div>
    );
}

const ConfirmContext = createContext(async () => false);

/** const confirm = useConfirm(); if (await confirm({ title })) { ... } */
export function ConfirmProvider({ children }) {
    const [state, setState] = useState(null);
    const resolver = useRef(null);

    const confirm = useCallback(
        (opts) =>
            new Promise((resolve) => {
                resolver.current = resolve;
                setState(opts);
            }),
        [],
    );

    const close = (result) => {
        resolver.current?.(result);
        setState(null);
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {state && <ConfirmDialog {...state} onConfirm={() => close(true)} onCancel={() => close(false)} />}
        </ConfirmContext.Provider>
    );
}

export const useConfirm = () => useContext(ConfirmContext);

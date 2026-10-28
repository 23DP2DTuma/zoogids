import { cloneElement, isValidElement, useEffect, useId } from 'react';
import { useI18n } from '../lang';

/** Universāls modālais logs (aizveras ar Esc vai klikšķi ārpusē). */
export function Modal({ title, onClose, children, size = 'max-w-lg' }) {
    const { t } = useI18n();
    const titleId = useId();

    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose?.();
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:items-center sm:p-4" onMouseDown={onClose}>
            <div role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(e) => e.stopPropagation()} className={`card my-4 w-full ${size} p-5 sm:p-6`}>
                <div className="mb-4 flex items-start justify-between gap-3">
                    <h2 id={titleId} className="text-xl font-extrabold">
                        {title}
                    </h2>
                    <button type="button" onClick={onClose} className="-mt-1 rounded-lg px-2 py-1 text-xl text-ink/50 hover:bg-black/5" aria-label={t('common.close')}>
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

/** Formas lauks ar etiķeti, kļūdas tekstu un pieejamības atribūtiem. */
export function Field({ label, error, hint, children, className = '' }) {
    const id = useId();
    const child = isValidElement(children)
        ? cloneElement(children, {
              id: children.props.id || id,
              'aria-invalid': error ? true : undefined,
              'aria-describedby': error ? `${id}-err` : undefined,
              className: `${children.props.className || ''}${error ? ' border-red-500' : ''}`,
          })
        : children;
    return (
        <div className={className}>
            <label htmlFor={isValidElement(children) ? children.props.id || id : undefined} className="label">
                {label}
            </label>
            {child}
            {hint && !error && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
            {error && (
                <p id={`${id}-err`} className="mt-1 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}

/** Formas pogas (Atcelt / Saglabāt) modālā loga apakšā. */
export function FormActions({ onCancel, busy, submitLabel }) {
    const { t } = useI18n();
    return (
        <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onCancel}>
                {t('common.cancel')}
            </button>
            <button className="btn-primary" disabled={busy}>
                {busy ? t('common.saving') : submitLabel || t('common.save')}
            </button>
        </div>
    );
}

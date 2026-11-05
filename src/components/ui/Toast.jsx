import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        const timeout = setTimeout(onClose, 3500);
        return () => clearTimeout(timeout);
    }, [onClose]);

    const isError = type === 'error';

    return (
        <div
            role={isError ? 'alert' : 'status'}
            className={`fixed right-4 top-4 z-[60] flex max-w-sm items-start gap-3 rounded-lg px-4 py-3 text-white shadow-lg transition-all ${
                isError ? 'bg-red-600' : 'bg-green-600'
            }`}
        >
            <span className="mt-0.5 text-lg">{isError ? '!' : '✓'}</span>
            <span className="flex-1 text-sm font-medium">{message}</span>
            <button type="button" onClick={onClose} className="text-xl leading-none opacity-80 hover:opacity-100" aria-label="Cerrar notificación">
                ×
            </button>
        </div>
    );
}

import { useEffect } from 'react';

export default function Toast({ toast, setToast }) {
  useEffect(() => {
    if (!toast?.open) return undefined;
    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, toast.duration || 3200);
    return () => clearTimeout(timer);
  }, [toast, setToast]);

  if (!toast?.open) return null;

  const tone =
    toast.type === 'error'
      ? 'bg-red-600 text-white'
      : toast.type === 'success'
      ? 'bg-green-600 text-white'
      : 'bg-orange-600 text-white';

  return (
    <div className="fixed top-20 md:top-24 right-5 z-[200] animate-in slide-in-from-top-3 fade-in duration-300">
      <div className={`${tone} min-w-[240px] max-w-[340px] px-5 py-4 rounded-2xl shadow-2xl border border-white/20`}>
        <p className="text-[9px] font-black uppercase tracking-[0.35em] mb-1">{toast.title || 'Notice'}</p>
        <p className="text-xs font-semibold leading-relaxed">{toast.message || ''}</p>
      </div>
    </div>
  );
}

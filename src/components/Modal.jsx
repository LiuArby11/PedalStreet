import { useCallback, useEffect } from 'react';

export default function Modal({ modal, setModal, onConfirm, onClose }) {
  const bgColor =
    modal.type === "error"
      ? "bg-red-600"
      : modal.type === "success"
        ? "bg-orange-600"
        : modal.type === "confirm"
          ? "bg-yellow-500"
          : "bg-white";

  const closeModal = useCallback(() => {
    setModal({ ...modal, open: false });
    if (onClose) onClose();
  }, [modal, onClose, setModal]);

  const confirmToneClass =
    modal.confirmTone === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : modal.confirmTone === 'success'
        ? 'bg-green-600 hover:bg-green-700 text-white'
        : modal.confirmTone === 'info'
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-orange-600 hover:bg-white hover:text-black text-white';

  useEffect(() => {
    if (!modal.open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (modal.type !== 'confirm') closeModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeModal, modal.open, modal.type]);

  if (!modal.open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 px-6">
      <div className="absolute inset-0" onClick={() => modal.type !== 'confirm' && closeModal()} />
      <div className="bg-[#0d0e12] border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
        <div className={`absolute top-0 left-0 right-0 rounded-t-[2.5rem] ${bgColor}`} />

        <h3 className="text-3xl font-black italic uppercase tracking-tight mb-4">
          {modal.title}
        </h3>

        <p className="text-zinc-400 text-sm mb-8">
          {modal.message}
        </p>

        {modal.type === "confirm" ? (
          <div className="flex gap-4">
            <button
              onClick={onConfirm}
              className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all active:scale-95 ${confirmToneClass}`}
            >
              {modal.confirmLabel || 'CONFIRM'}
            </button>
            <button
              onClick={closeModal}
              className="flex-1 bg-white text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-orange-600 hover:text-white transition-all"
            >
              {modal.cancelLabel || 'CANCEL'}
            </button>
          </div>
        ) : (
          <button
            onClick={closeModal}
            className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-white hover:text-black transition-all"
          >
            CONFIRM
          </button>
        )}
      </div>
    </div>
  );
}

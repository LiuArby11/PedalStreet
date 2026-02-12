export default function Modal({ modal, setModal, onConfirm }) {
  if (!modal.open) return null;

  const bgColor =
    modal.type === "error"
      ? "bg-red-600"
      : modal.type === "success"
        ? "bg-orange-600"
        : modal.type === "confirm"
          ? "bg-yellow-500"
          : "bg-white";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 px-6">
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
              className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-white hover:text-black transition-all"
            >
              CONFIRM
            </button>
            <button
              onClick={() => setModal({ ...modal, open: false })}
              className="flex-1 bg-white text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-orange-600 hover:text-white transition-all"
            >
              CANCEL
            </button>
          </div>
        ) : (
          <button
            onClick={() => setModal({ ...modal, open: false })}
            className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-white hover:text-black transition-all"
          >
            CONFIRM
          </button>
        )}
      </div>
    </div>
  );
}

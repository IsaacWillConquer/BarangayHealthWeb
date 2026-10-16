import { createPortal } from "react-dom";

export default function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }) {
  if (!open) return null;

  return createPortal(
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={`animate-modal-in w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl`}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-base font-bold text-stone-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-xl leading-none text-stone-400 transition-colors hover:text-stone-700"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}

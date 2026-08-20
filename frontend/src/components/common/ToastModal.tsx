import { CheckCircle2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  message?: string;
  onClose: () => void;
}

export function ToastModal({ isOpen, title, message, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all animate-fade-in">
      <div className="relative w-full max-w-sm p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-center flex flex-col items-center gap-3 transform transition-all scale-100">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/50">
          <CheckCircle2 size={28} />
        </div>

        <h3 className="text-lg font-extrabold text-white leading-snug">{title}</h3>

        {message && (
          <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
        )}

        <button
          onClick={onClose}
          className="mt-2 w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-md active:scale-95"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

import { AlertCircle, Info, CheckCircle2, Trash2, X, Loader2 } from 'lucide-react';


export interface ModalDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ModalDialog({
  isOpen,
  title,
  message,
  variant = 'info',
  confirmLabel = 'Confirm',
  cancelLabel,
  isLoading = false,
  onConfirm,
  onCancel
}: ModalDialogProps) {
  if (!isOpen) return null;

  const isConfirmDialog = Boolean(cancelLabel || onCancel);

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: Trash2,
          iconBg: 'bg-rose-950/80 text-rose-400 border-rose-500/30',
          btnBg: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/20'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconBg: 'bg-amber-950/80 text-amber-400 border-amber-500/30',
          btnBg: 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20'
        };
      case 'success':
        return {
          icon: CheckCircle2,
          iconBg: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30',
          btnBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
        };
      case 'info':
      default:
        return {
          icon: Info,
          iconBg: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/30',
          btnBg: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-500/20'
        };
    }
  };

  const styles = getVariantStyles();
  const Icon = styles.icon;

  const handleClose = () => {
    if (isLoading) return;
    if (onCancel) onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all animate-fadeIn">
      <div className="relative w-full max-w-sm p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-center flex flex-col items-center gap-4">
        {onCancel && (
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="absolute top-3.5 right-3.5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        )}

        {/* Header Icon */}
        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-lg ${styles.iconBg}`}>
          <Icon size={24} />
        </div>

        {/* Title & Message */}
        <div>
          <h3 className="text-lg font-extrabold text-white leading-snug">{title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed mt-1.5">{message}</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2.5 w-full pt-1">
          {isConfirmDialog && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all disabled:opacity-50"
            >
              {cancelLabel || 'Cancel'}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${styles.btnBg}`}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

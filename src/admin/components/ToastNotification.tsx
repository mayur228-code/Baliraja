import type { FC } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  messageEn: string;
  messageMr: string;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  lang: 'mr' | 'en';
  onDismiss: (id: string) => void;
}

export const ToastNotification: FC<ToastNotificationProps> = ({ toasts, lang, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-lg border flex items-start gap-3 transition-all animate-in slide-in-from-bottom-4 duration-200 bg-white/95 backdrop-blur-md ${
              isSuccess 
                ? 'text-stone-900 border-emerald-300 ring-1 ring-emerald-500/10 shadow-emerald-950/5' 
                : isError
                ? 'text-stone-900 border-rose-300 ring-1 ring-rose-500/10 shadow-rose-950/5'
                : 'text-stone-900 border-amber-300 ring-1 ring-amber-500/10 shadow-amber-950/5'
            }`}
          >
            {isSuccess && (
              <div className="p-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
            {isError && (
              <div className="p-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
            {!isSuccess && !isError && (
              <div className="p-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
            )}

            <div className="flex-1 text-xs font-semibold text-stone-800 leading-relaxed overflow-visible">
              {lang === 'mr' ? toast.messageMr : toast.messageEn}
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

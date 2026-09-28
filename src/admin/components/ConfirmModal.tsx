import type { FC } from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';
import type { Language } from '../../types';

interface ConfirmModalProps {
  isOpen: boolean;
  lang: Language;
  titleEn: string;
  titleMr: string;
  messageEn: string;
  messageMr: string;
  confirmLabelEn?: string;
  confirmLabelMr?: string;
  cancelLabelEn?: string;
  cancelLabelMr?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: FC<ConfirmModalProps> = ({
  isOpen,
  lang,
  titleEn,
  titleMr,
  messageEn,
  messageMr,
  confirmLabelEn = 'Confirm',
  confirmLabelMr = 'निश्चित करा',
  cancelLabelEn = 'Cancel',
  cancelLabelMr = 'रद्द करा',
  isDestructive = true,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${
              isDestructive 
                ? 'bg-red-50 text-red-700 ring-1 ring-red-200/70' 
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/70'
            }`}>
              {isDestructive ? <AlertCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 id="confirm-modal-title" className="text-base font-bold text-stone-900 leading-snug font-serif">
                  {lang === 'mr' ? titleMr : titleEn}
                </h3>
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-2.5 text-xs text-stone-600 leading-relaxed font-normal">
                {lang === 'mr' ? messageMr : messageEn}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-stone-50/80 border-t border-stone-200/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            {lang === 'mr' ? cancelLabelMr : cancelLabelEn}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-all cursor-pointer shadow-xs ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                : 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900'
            }`}
          >
            {lang === 'mr' ? confirmLabelMr : confirmLabelEn}
          </button>
        </div>
      </div>
    </div>
  );
};

import { useState } from 'react';
import type { FC, ReactNode } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Edit3 } from 'lucide-react';
import type { Language } from '../../types';

interface TranslationReviewDrawerProps {
  adminLang: Language;
  targetLang: Language;
  isModified?: boolean;
  children: ReactNode;
}

/**
 * TranslationReviewDrawer:
 * Collapsible section allowing optional manual review / edit of the counterpart language
 * without cluttering the main single-language entry view.
 */
export const TranslationReviewDrawer: FC<TranslationReviewDrawerProps> = ({
  adminLang,
  targetLang,
  isModified = false,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const targetLangLabel = targetLang === 'mr' ? (adminLang === 'mr' ? 'मराठी' : 'Marathi') : (adminLang === 'mr' ? 'इंग्रजी' : 'English');

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white overflow-hidden shadow-2xs transition-all">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-4 py-3 bg-stone-50/70 hover:bg-stone-100/80 flex items-center justify-between transition-colors cursor-pointer text-left select-none group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-lg bg-emerald-100/70 text-emerald-800 group-hover:bg-emerald-200 transition-colors">
            <Edit3 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-stone-800 truncate">
            {adminLang === 'mr'
              ? `${targetLangLabel} भाषेचे भाषांतर पहा / संपादित करा (पर्यायी)`
              : `Review / Edit ${targetLangLabel} Translation (Optional)`}
          </span>
          {isModified && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200/80 shrink-0">
              {adminLang === 'mr' ? 'हाताने बदललेले' : 'Manual Override'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-stone-500 font-semibold shrink-0 ml-2">
          <span>{isOpen ? (adminLang === 'mr' ? 'लपवा' : 'Hide') : (adminLang === 'mr' ? 'पहा' : 'Expand')}</span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-stone-200/80 space-y-4 bg-stone-50/30 animate-in fade-in duration-150">
          <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-100 text-xs text-emerald-900 leading-relaxed flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              {adminLang === 'mr'
                ? `हे फील्ड जतन करताना आपोआप भरले जाईल. हवे असल्यास तुम्ही येथे हाताने बदल करू शकता.`
                : `These fields are automatically generated when you save. You can make manual adjustments here if needed.`}
            </span>
          </div>
          {children}
        </div>
      )}
    </div>
  );
};

export default TranslationReviewDrawer;

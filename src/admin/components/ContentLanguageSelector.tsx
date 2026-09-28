import type { FC } from 'react';
import { Languages, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import type { Language } from '../../types';

interface ContentLanguageSelectorProps {
  contentLang: Language;
  onSelectContentLang: (lang: Language) => void;
  autoTranslate: boolean;
  onToggleAutoTranslate: (enabled: boolean) => void;
  isTranslating?: boolean;
  onManualTranslateNow?: () => void;
  hasBothTranslations?: boolean;
  adminLang: Language;
}

/**
 * ContentLanguageSelector:
 * Premium bilingual entry toolbar for admin forms.
 *
 * Provides:
 * 1. Single language entry toggle (Write in English OR Write in Marathi)
 * 2. Auto-translate on Save toggle (Default: ON)
 * 3. Immediate "Translate Now" preview action
 * 4. Bilingual parity status badge
 */
export const ContentLanguageSelector: FC<ContentLanguageSelectorProps> = ({
  contentLang,
  onSelectContentLang,
  autoTranslate,
  onToggleAutoTranslate,
  isTranslating = false,
  onManualTranslateNow,
  hasBothTranslations = true,
  adminLang
}) => {
  const targetLang: Language = contentLang === 'en' ? 'mr' : 'en';

  return (
    <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-3 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Language Selection Segmented Control */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
            <Languages className="w-4 h-4 text-emerald-700" />
            <span>
              {adminLang === 'mr' ? 'माहिती भरण्याची भाषा:' : 'Content Entry Language:'}
            </span>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-stone-100 border border-stone-200/80">
            <button
              type="button"
              onClick={() => onSelectContentLang('en')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                contentLang === 'en'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => onSelectContentLang('mr')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                contentLang === 'mr'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              मराठी
            </button>
          </div>
        </div>

        {/* Auto-Translate on Save Toggle & Manual Translate Button */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={autoTranslate}
              onChange={(e) => onToggleAutoTranslate(e.target.checked)}
              className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600 cursor-pointer accent-emerald-700"
            />
            <span className="text-xs font-semibold text-stone-700 group-hover:text-stone-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {adminLang === 'mr'
                  ? `जतन करताना ${targetLang === 'mr' ? 'मराठी' : 'English'} स्वयंचलित भाषांतर`
                  : `Auto-translate to ${targetLang === 'mr' ? 'Marathi' : 'English'} on Save`}
              </span>
            </span>
          </label>

          {/* Quick "Translate Now" Button */}
          {onManualTranslateNow && (
            <button
              type="button"
              disabled={isTranslating}
              onClick={onManualTranslateNow}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50 shadow-2xs"
              title={
                adminLang === 'mr'
                  ? 'आताच भाषांतर करून पूर्वावलोकन पहा'
                  : 'Translate right now to preview'
              }
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-emerald-700" />
                  <span>{adminLang === 'mr' ? 'भाषांतर होत आहे...' : 'Translating...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  <span>{adminLang === 'mr' ? 'आता भाषांतर करा' : 'Translate Now'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Subtext info & Bilingual status */}
      <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2 text-xs text-stone-500">
        <span className="leading-relaxed">
          {adminLang === 'mr'
            ? `तुम्ही ${contentLang === 'en' ? 'इंग्रजी' : 'मराठी'}मध्ये माहिती भरा, प्रणाली दुसरी भाषा स्वयंचलित तयार करेल.`
            : `Enter details in ${contentLang === 'en' ? 'English' : 'Marathi'} only. The system will automatically generate the counterpart language.`}
        </span>

        {hasBothTranslations ? (
          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold shrink-0 text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>
              {adminLang === 'mr' ? 'दोन्ही भाषा उपलब्ध' : 'Both languages ready'}
            </span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold shrink-0 text-[11px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
            <span>
              {adminLang === 'mr' ? 'भाषांतर प्रलंबित' : 'Translation pending'}
            </span>
          </span>
        )}
      </div>
    </div>
  );
};

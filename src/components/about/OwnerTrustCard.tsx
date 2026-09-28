import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  Store, 
  MapPin, 
  Gem, 
  ShieldCheck, 
  CheckCircle2, 
  Compass 
} from 'lucide-react';
import type { Language } from '../../types';
import { verifiedBusinessInfo } from '../../data/aboutData';
import { translations } from '../../data/translations';

interface OwnerTrustCardProps {
  lang: Language;
}

export const OwnerTrustCard: FC<OwnerTrustCardProps> = ({ lang }) => {
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  const motionProps = shouldReduceMotion
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: false, margin: '-40px' },
        transition: { duration: 0.45, delay: 0.1, ease: 'easeOut' as const }
      };

  return (
    <motion.div
      {...motionProps}
      className="space-y-4"
    >
      {/* 1. Verified Agricultural Business Details Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100/80">
              <Store className="w-4 h-4 text-emerald-700" aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-sm font-black font-serif text-stone-900 leading-tight">
                {t.ownerTrustTitle}
              </h4>
              <span className="text-3xs font-semibold text-stone-500 uppercase tracking-wider block">
                {t.ownerTrustSubtitle}
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
            <ShieldCheck className="w-3 h-3" aria-hidden="true" />
            <span>{t.verifiedBadge}</span>
          </span>
        </div>

        {/* Core Business Data Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          {/* Main Agricultural Business */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-1">
            <span className="text-3xs font-bold uppercase tracking-wider text-stone-400 block">
              {t.businessEntityLabel}
            </span>
            <p className="font-bold text-stone-900 text-sm font-serif">
              {lang === 'mr' ? verifiedBusinessInfo.businessNameMr : verifiedBusinessInfo.businessNameEn}
            </p>
            <div className="flex items-center gap-1 text-2xs text-emerald-800 font-medium pt-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>{lang === 'mr' ? 'कृषी सेवा केंद्र' : 'Agricultural Service Center'}</span>
            </div>
          </div>

          {/* Native Village Information */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-1">
            <span className="text-3xs font-bold uppercase tracking-wider text-stone-400 block">
              {t.ownerNativeVillage}
            </span>
            <div className="flex items-center gap-1.5 font-bold text-stone-900 text-sm">
              <Compass className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>{lang === 'mr' ? verifiedBusinessInfo.nativePlaceMr : verifiedBusinessInfo.nativePlaceEn}</span>
            </div>
            <p className="text-2xs text-stone-500">
              {lang === 'mr' ? 'संचालकांचे मूळ गाव' : 'Proprietor native locality'}
            </p>
          </div>
        </div>

        {/* Physical Store Location */}
        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-1">
          <div className="flex items-center gap-1.5 text-3xs font-bold uppercase tracking-wider text-stone-400">
            <MapPin className="w-3 h-3 text-emerald-700" aria-hidden="true" />
            <span>{t.ownerLocationLabel}</span>
          </div>
          <p className="text-xs font-semibold text-stone-800 leading-relaxed">
            {lang === 'mr' ? verifiedBusinessInfo.shopAddressMr : verifiedBusinessInfo.shopAddressEn}
          </p>
        </div>
      </div>

      {/* 2. Associated Business Entity (Baliraja Jewellers) */}
      {/* Handled strictly according to Prompt 7 Section 12: Clear distinction, no invented agricultural claims or services */}
      <div className="bg-stone-50/90 rounded-3xl p-5 border border-stone-200/80 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/70">
              <Gem className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            </div>
            <div>
              <span className="text-2xs font-bold uppercase tracking-wider text-stone-500 block">
                {t.otherBusinessTitle}
              </span>
              <h5 className="text-sm font-black font-serif text-stone-900 leading-tight">
                {lang === 'mr' ? verifiedBusinessInfo.otherBusinessNameMr : verifiedBusinessInfo.otherBusinessNameEn}
              </h5>
            </div>
          </div>

          <span className="text-3xs font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
            {lang === 'mr' ? 'इतर व्यवसाय' : 'Other Business'}
          </span>
        </div>

        <p className="text-2xs text-stone-600 leading-relaxed pl-1">
          {lang === 'mr' ? 'सराफ लाईन, बसस्थानकाजवळ, कैज' : 'Saraf line near bustand, Kaij'}
        </p>
      </div>
    </motion.div>
  );
};

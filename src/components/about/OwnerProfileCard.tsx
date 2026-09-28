import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Info, 
  MessageCircle, 
  ArrowUpRight,
  ShieldCheck,
  User
} from 'lucide-react';
import type { Language } from '../../types';
import { ownerProfile, verifiedBusinessInfo } from '../../data/aboutData';
import { translations } from '../../data/translations';

interface OwnerProfileCardProps {
  lang: Language;
}

export const OwnerProfileCard: FC<OwnerProfileCardProps> = ({ lang }) => {
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  const motionProps = shouldReduceMotion
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: false, margin: '-40px' },
        transition: { duration: 0.45, ease: 'easeOut' as const }
      };

  return (
    <motion.div
      {...motionProps}
      className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm relative overflow-hidden flex flex-col justify-between"
    >
      {/* Subtle background decorative watermark / accent */}
      <div 
        className="absolute top-0 right-0 w-48 h-48 bg-radial from-emerald-50 to-transparent opacity-70 pointer-events-none rounded-bl-full" 
        aria-hidden="true" 
      />

      <div className="space-y-6 relative z-10">
        {/* Top Header & Verification Status */}
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100/80">
              <User className="w-4 h-4 text-emerald-700" aria-hidden="true" />
            </div>
            <div>
              <span className="text-2xs font-bold uppercase tracking-wider text-stone-500 block">
                {t.ownerProfileSectionTitle}
              </span>
              <span className="text-xs font-semibold text-stone-800">
                {lang === 'mr' ? 'संचालक' : 'Proprietor'}
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-2xs font-bold">
            <ShieldCheck className="w-3 h-3 text-emerald-700" aria-hidden="true" />
            <span>{t.verifiedBadge}</span>
          </div>
        </div>

        {/* Profile Avatar & Primary Identity */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Owner Photo or Typographic Monogram Placeholder */}
          {ownerProfile.image ? (
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-emerald-700/20 shadow-xs shrink-0">
              <img
                src={ownerProfile.image}
                alt={lang === 'mr' ? ownerProfile.nameMr : ownerProfile.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="relative flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 text-white shadow-md border border-stone-700/80 shrink-0 select-none">
              <span className="font-serif text-2xl sm:text-3xl font-black text-amber-300 tracking-wider">
                GS
              </span>
              <span className="text-3xs font-semibold uppercase tracking-widest text-stone-300 mt-0.5">
                {ownerProfile.name}
              </span>
              <span className="absolute -bottom-2 bg-stone-100 text-stone-700 border border-stone-300 text-3xs font-bold px-1.5 py-0.5 rounded-md shadow-2xs whitespace-nowrap">
                {t.demoPhotoNotice}
              </span>
            </div>
          )}

          {/* Identity Details */}
          <div className="space-y-1.5 pt-1 sm:pt-0">
            <h3 className="text-xl sm:text-2xl font-black font-serif text-stone-900 leading-tight">
              {lang === 'mr' ? ownerProfile.nameMr : ownerProfile.name}
            </h3>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-800 font-bold border border-stone-200">
                {lang === 'mr' ? ownerProfile.role.mr : ownerProfile.role.en}
              </span>

              <div className="inline-flex items-center gap-1 text-stone-600">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="text-stone-700 font-semibold">{t.ownerNativeVillage}:</strong>{' '}
                  {lang === 'mr' ? ownerProfile.village.mr : ownerProfile.village.en}
                </span>
              </div>
            </div>

            <p className="text-2xs text-stone-500 font-medium">
              {lang === 'mr' ? verifiedBusinessInfo.businessNameMr : verifiedBusinessInfo.businessNameEn}
            </p>
          </div>
        </div>

        {/* Short Biography with Clear Demo Transparency Badge */}
        <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/90 space-y-2.5 text-left">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-stone-500">
              <Info className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              <span>{lang === 'mr' ? 'थोडक्यात माहिती' : 'Background Overview'}</span>
            </div>

            {/* Subtle, non-intrusive Demo Transparency Badge */}
            {ownerProfile.isDemoContent && (
              <span 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/90 text-amber-900 text-3xs font-bold"
                title={t.demoBioNotice}
              >
                <span>{t.demoBadgeLabel}</span>
              </span>
            )}
          </div>

          <p className="text-xs text-stone-700 leading-relaxed">
            {lang === 'mr' ? ownerProfile.bio.mr : ownerProfile.bio.en}
          </p>

          {ownerProfile.isDemoContent && (
            <p className="text-3xs text-stone-600 italic">
              * {t.demoBioNotice}
            </p>
          )}
        </div>

        {/* Direct Contact Actions */}
        <div className="space-y-2.5 pt-2">
          <span className="text-2xs font-bold uppercase tracking-wider text-stone-400 block">
            {t.contactDirectly}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Direct Phone Call (Flow Button) */}
            <a
              href={`tel:${verifiedBusinessInfo.phone}`}
              className="flow-btn inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-700 outline-hidden"
              aria-label={
                lang === 'mr' 
                  ? `गणेश शिंदे यांना ${verifiedBusinessInfo.phone} वर फोन करा` 
                  : `Call Ganesh Shinde at ${verifiedBusinessInfo.phone}`
              }
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>{t.callActionLabel}: {verifiedBusinessInfo.phone}</span>
            </a>

            {/* Direct WhatsApp Message (Flow Button) */}
            <a
              href={`https://wa.me/91${verifiedBusinessInfo.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flow-btn inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 outline-hidden"
              aria-label={
                lang === 'mr'
                  ? `गणेश शिंदे यांच्याशी WhatsApp वर संपर्क करा (${verifiedBusinessInfo.whatsapp})`
                  : `Connect with Ganesh Shinde on WhatsApp (${verifiedBusinessInfo.whatsapp})`
              }
            >
              <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.whatsappActionLabel}</span>
              <ArrowUpRight className="w-3 h-3 opacity-70" aria-hidden="true" />
            </a>
          </div>

          {/* Email Channel (Flow Button Light) */}
          <a
            href={`mailto:${verifiedBusinessInfo.email}`}
            className="flow-btn flow-btn-light w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-semibold cursor-pointer border border-stone-200 focus-visible:ring-2 focus-visible:ring-emerald-700 outline-hidden"
            aria-label={
              lang === 'mr'
                ? `ईमेल पाठवा: ${verifiedBusinessInfo.email}`
                : `Send email to ${verifiedBusinessInfo.email}`
            }
          >
            <Mail className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
            <span className="truncate">{verifiedBusinessInfo.email}</span>
          </a>
        </div>
      </div>
    </motion.div>
  );
};

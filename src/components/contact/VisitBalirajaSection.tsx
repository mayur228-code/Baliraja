import { lazy, Suspense } from 'react';
import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  MapPin, 
  Navigation, 
  PhoneCall, 
  Clock, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import type { Language } from '../../types';
import { useContentStore } from '../../data/contentStore';
import { translations } from '../../data/translations';
import { AnimatedUnderline } from '../common/AnimatedSectionHeading';
import { MapSkeleton } from '../common/LoadingSystem';
import logoImg from '../../assets/logo.png';

const LeafletMap = lazy(() => import('./LeafletMap'));

interface VisitBalirajaSectionProps {
  lang: Language;
}

/**
 * Visit Baliraja / Shop Location Section:
 * Prominently helps farmers easily locate and navigate to the Baliraja Krishi Seva Kendra shop.
 * Replaces the former "Experience From the Field" section on the Home page.
 *
 * Integrated with the verified centralized businessInfo store.
 */
export const VisitBalirajaSection: FC<VisitBalirajaSectionProps> = ({ lang }) => {
  const shouldReduceMotion = useReducedMotion();
  const { businessInfo } = useContentStore();
  const t = translations[lang];

  const shopName = lang === 'mr' ? businessInfo.businessNameMr : businessInfo.businessNameEn;
  const address = lang === 'mr' ? businessInfo.location.addressMr : businessInfo.location.addressEn;
  const lat = businessInfo.location.latitude ?? 18.7042;
  const lng = businessInfo.location.longitude ?? 75.9556;
  const mapsExternalUrl = 
    businessInfo.location.googleMapsExternalUrl || 
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || 'Manglagwar Peth, Kaij, Dist. Beed, Maharashtra 431123')}`;
  const phone = businessInfo.phone || '9881070520';

  return (
    <section
      id="visit-baliraja"
      aria-labelledby="visit-baliraja-heading"
      className="relative py-10 sm:py-14 lg:py-16 my-6 rounded-3xl bg-gradient-to-b from-stone-50/90 via-white/95 to-stone-50/90 border border-stone-200/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden scroll-mt-24"
    >
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── Section Header (Standardized Baliraja Heading System) ── */}
        <div className="group/heading text-center max-w-2xl mx-auto mb-8 sm:mb-12 cursor-default select-none">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-20px' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* Subtle Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full bg-emerald-100/80 text-emerald-900 border border-emerald-300/80 text-2xs font-bold uppercase tracking-wider">
              <MapPin className="w-3 h-3 text-emerald-700" aria-hidden="true" />
              <span>{t.visitBalirajaBadge}</span>
            </div>

            <h2
              id="visit-baliraja-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-emerald-950 tracking-tight transition-all duration-300 ease-out group-hover/heading:-translate-y-0.5 group-hover/heading:text-emerald-900"
            >
              {t.visitBalirajaHeading}
            </h2>

            <p className="mt-2 text-xs sm:text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
              {t.visitBalirajaSubheading}
            </p>
          </motion.div>

          {/* Animated Agricultural Underline matching website standard */}
          <AnimatedUnderline />
        </div>

        {/* ── Two-Column Responsive Location Card ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* ── Left Column: Store Details & Navigation Actions ── */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, margin: '-20px' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white/85 backdrop-blur-md border border-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_24px_rgba(0,0,0,0.05)] space-y-6"
          >
            {/* Top Identity Block */}
            <div className="space-y-4">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', '/');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-3 group cursor-pointer"
                title={lang === 'mr' ? 'मुख्यपृष्ठावर जा' : 'Go to Home'}
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-1.5 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:border-emerald-300 transition-all">
                  <img
                    src={logoImg}
                    alt="Baliraja Logo"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-serif text-stone-900 group-hover:text-emerald-900 leading-tight transition-colors">
                    {shopName}
                  </h3>
                  <div className="inline-flex items-center gap-1 text-2xs font-semibold text-emerald-700 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    <span>{t.visitBalirajaMapBadge}</span>
                  </div>
                </div>
              </a>

              {/* Address Block */}
              <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/80 space-y-1.5">
                <div className="text-2xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                  <span>{t.visitBalirajaAddressLabel}</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-stone-800 leading-relaxed">
                  {address}
                </p>
                <div className="text-3xs text-stone-500 pt-0.5">
                  {lang === 'mr' ? 'तालुका: कैज • जिल्हा: बीड • पिनकोड: ४३११२३' : 'Taluka: Kaij • District: Beed • Pincode: 431123'}
                </div>
              </div>

              {/* Working Hours & Guidance */}
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-amber-900 text-xs">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                <span className="font-medium text-2xs sm:text-xs">
                  {t.visitBalirajaOpeningHours}
                </span>
              </div>
            </div>

            {/* Bottom Navigation CTA Buttons */}
            <div className="space-y-3 pt-2">
              {/* Primary Map Navigation Button */}
              <motion.a
                href={mapsExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.01 }}
                whileTap={shouldReduceMotion ? undefined : { y: 0, scale: 0.99 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md hover:shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 outline-hidden cursor-pointer group transition-colors"
                aria-label={
                  lang === 'mr'
                    ? `Google Maps वर बळीराजा कृषी सेवा केंद्राचा पत्ता उघडा`
                    : `Open Baliraja Krishi Seva Kendra location on Google Maps`
                }
              >
                <Navigation className="w-4 h-4 text-emerald-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" aria-hidden="true" />
                <span>{t.visitBalirajaGetDirections}</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-300/80 ml-0.5" aria-hidden="true" />
              </motion.a>

              {/* Direct Call Secondary Button */}
              <a
                href={`tel:${phone}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-800 font-semibold text-xs transition-colors cursor-pointer"
                aria-label={lang === 'mr' ? `थेट फोन करा: ${phone}` : `Call store directly: ${phone}`}
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                <span>{lang === 'mr' ? `थेट फोन: ${phone}` : `Call: ${phone}`}</span>
              </a>
            </div>
          </motion.div>

          {/* ── Right Column: Interactive Embedded Map Preview ── */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, margin: '-20px' }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.08 }}
            className="lg:col-span-7 flex flex-col"
          >
            <div className="relative w-full h-full min-h-[340px] sm:min-h-[380px] lg:min-h-[420px] rounded-3xl overflow-hidden border border-stone-200/90 shadow-sm bg-stone-100 group">
              {/* Floating Map Location Pill (Desktop & Tablet) */}
              <div className="absolute top-3.5 left-3.5 z-20 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-stone-200 shadow-sm pointer-events-none select-none">
                <span className="w-2 h-2 rounded-full bg-emerald-600" aria-hidden="true" />
                <span className="text-2xs font-bold text-stone-800">
                  {lang === 'mr' ? 'मंगळवार पेठ, कैज' : 'Manglagwar Peth, Kaij'}
                </span>
              </div>

              {/* Real Leaflet OpenStreetMap Map (Lazy Loaded with MapSkeleton) */}
              <Suspense fallback={<MapSkeleton />}>
                <LeafletMap
                  latitude={lat}
                  longitude={lng}
                  shopName={shopName}
                  address={address}
                  lang={lang}
                  externalMapUrl={mapsExternalUrl}
                  className="w-full h-full min-h-[340px] sm:min-h-[380px] lg:min-h-[420px]"
                />
              </Suspense>

              {/* Mobile Quick Tap Overlay Button */}
              <div className="sm:hidden absolute bottom-3 inset-x-3 z-20">
                <a
                  href={mapsExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-white/95 backdrop-blur-md rounded-xl border border-stone-300 shadow-md text-xs font-bold text-emerald-900 flex items-center justify-center gap-2"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{t.visitBalirajaGetDirections}</span>
                </a>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
};

export default VisitBalirajaSection;

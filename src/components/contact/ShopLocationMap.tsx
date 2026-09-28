import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  MapPin, 
  ExternalLink, 
  Store, 
  Compass, 
  ShieldCheck 
} from 'lucide-react';
import type { Language } from '../../types';
import { useContentStore } from '../../data/contentStore';
import { translations } from '../../data/translations';
import { LeafletMap } from './LeafletMap';

interface ShopLocationMapProps {
  lang: Language;
}

export const ShopLocationMap: FC<ShopLocationMapProps> = ({ lang }) => {
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

  const motionProps = shouldReduceMotion
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: false, margin: '-30px' },
        transition: { duration: 0.45, ease: 'easeOut' as const }
      };

  return (
    <motion.div
      {...motionProps}
      id="contact-map"
      className="bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_24px_rgba(0,0,0,0.05)] space-y-6 scroll-mt-28"
    >
      {/* Map Header & Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
            <Compass className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
            <span>{t.mapSectionTitle}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black font-serif text-stone-900 tracking-tight leading-tight">
            {lang === 'mr' ? 'केंद्राचे प्रत्यक्ष स्थान व नकाशा' : 'Physical Store Location & Map'}
          </h3>

          <div className="flex items-start gap-2 text-xs sm:text-sm text-stone-600">
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="font-semibold text-stone-800">
              {address}
            </span>
          </div>
        </div>

        {/* Primary Action: Open in Google Maps (Flow Button) */}
        <div className="shrink-0">
          <a
            href={mapsExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flow-btn inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs hover:shadow-emerald-700/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 outline-hidden"
            aria-label={
              lang === 'mr'
                ? `Google Maps वर ${shopName} चा पत्ता उघडा`
                : `Open ${shopName} location in Google Maps`
            }
          >
            <MapPin className="w-4 h-4 text-emerald-200" aria-hidden="true" />
            <span>{t.openInGoogleMapsBtn}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* Map Window Container */}
      <div className="relative rounded-2xl overflow-hidden border border-stone-200/90 shadow-inner bg-stone-100 min-h-[340px] sm:min-h-[380px] lg:min-h-[420px]">
        {/* Subtle Floating Location Badge Overlay (Desktop / Tablet) */}
        <div className="absolute top-3 left-3 z-20 hidden sm:flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-stone-200 shadow-sm pointer-events-none select-none">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
            <Store className="w-4 h-4 text-emerald-700" aria-hidden="true" />
          </div>
          <div>
            <span className="text-xs font-black font-serif text-stone-900 block leading-tight">
              {shopName}
            </span>
            <span className="text-3xs font-semibold text-stone-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" aria-hidden="true" />
              {t.mapAddressNotice}
            </span>
          </div>
        </div>

        {/* Real Leaflet OpenStreetMap Map */}
        <LeafletMap
          latitude={lat}
          longitude={lng}
          shopName={shopName}
          address={address}
          lang={lang}
          externalMapUrl={mapsExternalUrl}
          className="w-full h-full min-h-[340px] sm:min-h-[380px] lg:min-h-[420px]"
        />
      </div>

      {/* Ground Directions Note */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-2xs text-stone-500 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" aria-hidden="true" />
          <span>{t.mapFallbackDirections}</span>
        </div>

        <span className="text-stone-400 italic">
          {lang === 'mr'
            ? `पिनकोड: ${businessInfo.location.pincode || '४३११२३'} • तालुका: ${businessInfo.location.cityMr || 'कैज'} • जिल्हा: ${businessInfo.location.districtMr || 'बीड'}`
            : `Pincode: ${businessInfo.location.pincode || '431123'} • Taluka: ${businessInfo.location.cityEn || 'Kaij'} • District: ${businessInfo.location.districtEn || 'Beed'}`}
        </span>
      </div>
    </motion.div>
  );
};

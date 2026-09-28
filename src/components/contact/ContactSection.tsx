import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  MapPin, 
  Sparkles, 
  ArrowLeft, 
  ArrowDown 
} from 'lucide-react';
import { InstagramIcon } from '../common/InstagramIcon';
import type { Language } from '../../types';
import { useContentStore } from '../../data/contentStore';
import { translations } from '../../data/translations';
import { ContactCard } from './ContactCard';
import { ShopLocationMap } from './ShopLocationMap';

interface ContactSectionProps {
  lang: Language;
  isStandalone?: boolean;
  onBackToHome?: () => void;
}

export const ContactSection: FC<ContactSectionProps> = ({
  lang,
  isStandalone = false,
  onBackToHome
}) => {
  const shouldReduceMotion = useReducedMotion();
  const { businessInfo } = useContentStore();
  const t = translations[lang];

  const motionProps = shouldReduceMotion
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: false, margin: '-30px' },
        transition: { duration: 0.45, ease: 'easeOut' as const }
      };

  const scrollToMap = () => {
    const el = document.getElementById('contact-map');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="space-y-12 sm:space-y-16 py-8 border-t border-stone-200/90 text-left scroll-mt-24"
    >
      {/* Standalone Return Bar (when navigated directly via ?section=contact) */}
      {isStandalone && onBackToHome && (
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <button
            type="button"
            onClick={onBackToHome}
            className="text-xs font-bold text-stone-600 hover:text-emerald-800 transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-700 outline-hidden rounded-lg px-1 py-0.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.backToHomeFromAbout}</span>
          </button>

          <span className="text-2xs font-semibold uppercase tracking-wider text-stone-400">
            {t.contactDetails}
          </span>
        </div>
      )}

      {/* 1. Cinematic Contact Section Header */}
      <motion.div {...motionProps} className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300/80 px-3 py-1 rounded-full text-2xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-emerald-700" aria-hidden="true" />
          <span>{t.contactSectionBadge}</span>
        </div>

        <h2
          id="contact-heading"
          className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif text-stone-900 tracking-tight leading-tight"
        >
          {t.contactSectionHeading}
        </h2>

        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          {t.contactSectionSubheading}
        </p>
      </motion.div>

      {/* 2. Premium 4-Card Contact Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Phone */}
        <ContactCard
          icon={<Phone className="w-5 h-5 text-emerald-700" />}
          title={t.contactPhoneCardTitle}
          detail={businessInfo.phone}
          actionText={t.contactPhoneBtn}
          href={`tel:${businessInfo.phone}`}
          badge={lang === 'mr' ? 'थेट फोन' : 'Direct Call'}
          ariaLabel={
            lang === 'mr'
              ? `${businessInfo.phone} वर फोन करा`
              : `Call ${businessInfo.phone}`
          }
        />

        {/* Card 2: WhatsApp */}
        <ContactCard
          icon={<MessageCircle className="w-5 h-5 text-emerald-700" />}
          title={t.contactWhatsAppCardTitle}
          detail={businessInfo.phone}
          actionText={t.contactWhatsAppBtn}
          href={`https://wa.me/91${businessInfo.whatsapp}`}
          isExternal={true}
          badge={lang === 'mr' ? 'जलद उत्तर' : 'Fast Advisory'}
          ariaLabel={
            lang === 'mr'
              ? `WhatsApp वर संपर्क करा: ${businessInfo.phone}`
              : `Chat on WhatsApp at ${businessInfo.phone}`
          }
        />

        {/* Card 3: Email */}
        <ContactCard
          icon={<Mail className="w-5 h-5 text-emerald-700" />}
          title={t.contactEmailCardTitle}
          detail={businessInfo.email}
          actionText={t.contactEmailBtn}
          href={`mailto:${businessInfo.email}`}
          badge={lang === 'mr' ? 'ईमेल' : 'Email'}
          ariaLabel={
            lang === 'mr'
              ? `${businessInfo.email} वर ईमेल पाठवा`
              : `Send email to ${businessInfo.email}`
          }
        />

        {/* Card 4: Instagram */}
        <ContactCard
          icon={<InstagramIcon className="w-5 h-5 text-stone-400" />}
          title={t.contactInstagramCardTitle}
          detail={businessInfo.social.instagramUrl ? (businessInfo.social.instagramHandle || 'Instagram') : t.contactInstagramComingSoon}
          isDisabled={!businessInfo.social.instagramUrl}
          disabledBadge={lang === 'mr' ? 'लवकरच' : 'Coming Soon'}
          href={businessInfo.social.instagramUrl}
          isExternal={true}
          ariaLabel={
            businessInfo.social.instagramUrl
              ? (lang === 'mr' ? 'बळीराजा Instagram प्रोफाइल' : 'Baliraja Instagram profile')
              : (lang === 'mr' ? 'बळीराजा कृषी सेवा केंद्र Instagram प्रोफाइल लवकरच येत आहे' : 'Baliraja Krishi Seva Kendra Instagram profile coming soon')
          }
        />
      </div>

      {/* 3. Address Card with Quick Scroll-to-Map Action */}
      <div className="p-5 sm:p-6 rounded-2xl bg-stone-50 border border-stone-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white text-emerald-800 flex items-center justify-center border border-stone-200 shrink-0 mt-0.5">
            <MapPin className="w-5 h-5 text-emerald-700" aria-hidden="true" />
          </div>

          <div className="space-y-1">
            <span className="text-2xs font-bold uppercase tracking-wider text-stone-400 block">
              {t.contactAddressCardTitle}
            </span>
            <p className="text-sm sm:text-base font-bold text-stone-900 leading-snug">
              {lang === 'mr' ? businessInfo.location.addressMr : businessInfo.location.addressEn}
            </p>
            <p className="text-2xs text-stone-500">
              {lang === 'mr'
                ? `संचालक: ${businessInfo.ownerNameMr} • मूळ गाव: ${businessInfo.nativePlaceMr} • तालुका: ${businessInfo.location.cityMr} • जिल्हा: ${businessInfo.location.districtMr}`
                : `Proprietor: ${businessInfo.ownerNameEn} • Native Place: ${businessInfo.nativePlaceEn} • Taluka: ${businessInfo.location.cityEn} • District: ${businessInfo.location.districtEn}`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={scrollToMap}
          className="flow-btn flow-btn-light inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold border border-stone-200 cursor-pointer shadow-2xs shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-700 outline-hidden"
          aria-label={lang === 'mr' ? 'नकाशा विभागावर स्क्रोल करा' : 'Scroll to map location'}
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
          <span>{t.viewOnMapBtn}</span>
          <ArrowDown className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
        </button>
      </div>

      {/* 4. Google Map Location Window */}
      <ShopLocationMap lang={lang} />
    </section>
  );
};

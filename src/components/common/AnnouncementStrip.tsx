import type { FC } from 'react';
import { Sprout } from 'lucide-react';
import type { Language } from '../../types';

interface AnnouncementStripProps {
  lang: Language;
}

// Strictly no commas; pure English or pure Marathi depending on active language
const MESSAGES: Record<Language, string[]> = {
  mr: [
    'बियाणे\u00A0\u00A0रासायनिक खते\u00A0\u00A0कीटकनाशके\u00A0\u00A0भाजीपाला बियाणे उपलब्ध',
    'शेतकऱ्यांचा विश्वास',
    'तज्ज्ञ मार्गदर्शन',
    'विविध प्रकारची उत्पादने',
    'सन २०१६ पासून'
  ],
  en: [
    'SEEDS\u00A0\u00A0CHEMICAL FERTILIZER\u00A0\u00A0PESTICIDES\u00A0\u00A0VEGETABLE SEEDS WILL BE AVAILABLE',
    'FARMER TRUSTED',
    'EXPERT SUPPORT',
    'VARIETY OF PRODUCTS',
    'SINCE 2016'
  ]
};

export const AnnouncementStrip: FC<AnnouncementStripProps> = ({ lang }) => {
  const currentMessages = MESSAGES[lang] || MESSAGES.en;

  // Repeat sequence 2 times per track for lightweight 60fps marquee
  const trackItems = [
    ...currentMessages,
    ...currentMessages,
  ];

  return (
    <div 
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-hidden bg-gradient-to-r from-red-950 via-red-800 to-red-950 py-3 sm:py-3.5 border-y border-red-900/80 shadow-xs select-none pointer-events-none"
      style={{ contentVisibility: 'auto' }}
      role="region"
      aria-label={lang === 'mr' ? 'महत्त्वाच्या घोषणा' : 'Announcements'}
    >
      {/* key={lang} ensures immediate instant swap of language with zero residual text */}
      <div key={lang} className="flex overflow-hidden w-full">
        {/* Track 1: First continuous loop block travelling from far right to far left */}
        <div className="flex shrink-0 animate-marquee-scroll items-center gap-6 sm:gap-8 pr-6 sm:pr-8">
          {trackItems.map((message, idx) => (
            <div key={`track-1-${idx}`} className="inline-flex items-center gap-6 sm:gap-8 shrink-0">
              <span className="text-white font-medium sm:font-semibold text-xs sm:text-sm tracking-wider whitespace-nowrap">
                {message}
              </span>
              <Sprout 
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 fill-amber-400/40 stroke-[2.2] shrink-0" 
                aria-hidden="true" 
              />
            </div>
          ))}
        </div>

        {/* Track 2: Identical duplicate loop block creating zero-jump seamless continuity */}
        <div 
          className="flex shrink-0 animate-marquee-scroll items-center gap-6 sm:gap-8 pr-6 sm:pr-8" 
          aria-hidden="true"
        >
          {trackItems.map((message, idx) => (
            <div key={`track-2-${idx}`} className="inline-flex items-center gap-6 sm:gap-8 shrink-0">
              <span className="text-white font-medium sm:font-semibold text-xs sm:text-sm tracking-wider whitespace-nowrap">
                {message}
              </span>
              <Sprout 
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 fill-amber-400/40 stroke-[2.2] shrink-0" 
                aria-hidden="true" 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

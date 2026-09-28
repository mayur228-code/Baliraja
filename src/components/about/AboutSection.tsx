import type { FC } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Language } from '../../types';
import { translations } from '../../data/translations';
import { StoryHero } from './StoryHero';
import { StoryOrigin } from './StoryOrigin';
import { StoryFounder } from './StoryFounder';
import { StoryWhy } from './StoryWhy';
import { StoryTimeline } from './StoryTimeline';
import { StoryGrowingWithFarmers } from './StoryGrowingWithFarmers';
import { StoryPillars } from './StoryPillars';
import { StoryToday } from './StoryToday';
import { StoryBeliefs } from './StoryBeliefs';
import { StoryClosing } from './StoryClosing';

interface AboutSectionProps {
  lang: Language;
  onContactClick?: () => void;
  isStandalone?: boolean;
  onBackToHome?: () => void;
}

export const AboutSection: FC<AboutSectionProps> = ({
  lang,
  onContactClick,
  isStandalone = false,
  onBackToHome
}) => {
  const t = translations[lang];

  const handleExploreClick = () => {
    const el = document.getElementById('story-origin');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <article
      id="about"
      aria-label={t.storyHeroTitle}
      className="space-y-12 sm:space-y-16 pb-12 text-left scroll-mt-24"
    >
      {/* Standalone Navigation Bar (when navigated directly via /about or ?section=about) */}
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
            {lang === 'mr' ? 'बळीराजाचा जीवनप्रवास' : 'The Baliraja Story'}
          </span>
        </div>
      )}

      {/* 1. Cinematic Story Hero */}
      <StoryHero
        lang={lang}
        onExploreClick={handleExploreClick}
      />

      {/* 2. Where It All Began (2016) */}
      <StoryOrigin lang={lang} />

      {/* 3. The Person Behind Baliraja (Founder) */}
      <StoryFounder
        lang={lang}
        onContactClick={onContactClick}
      />

      {/* 4. Why Baliraja? */}
      <StoryWhy lang={lang} />

      {/* 5. The Journey of Baliraja (Vertical Timeline) */}
      <StoryTimeline lang={lang} />

      {/* 6. Growing with Farmers */}
      <StoryGrowingWithFarmers lang={lang} />

      {/* 7. Experience → Knowledge → Guidance → Trust (4 Pillars) */}
      <StoryPillars lang={lang} />

      {/* 8. Baliraja Today */}
      <StoryToday lang={lang} />

      {/* 9. What We Believe (Core Principles) */}
      <StoryBeliefs lang={lang} />

      {/* 10. The Journey Continues + Contact CTA */}
      <StoryClosing
        lang={lang}
        onContactClick={onContactClick}
        onBackToHome={onBackToHome}
      />
    </article>
  );
};

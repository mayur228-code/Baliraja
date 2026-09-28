import type { FC, ReactNode } from 'react';

interface StatCardProps {
  labelEn: string;
  labelMr: string;
  value: string | number;
  subtextEn?: string;
  subtextMr?: string;
  icon: ReactNode;
  lang: 'mr' | 'en';
  accent?: 'emerald' | 'amber' | 'stone' | 'blue';
}

export const StatCard: FC<StatCardProps> = ({
  labelEn,
  labelMr,
  value,
  subtextEn,
  subtextMr,
  icon,
  lang,
  accent = 'emerald'
}) => {
  const accentBorder = {
    emerald: 'border-l-4 border-l-emerald-600',
    amber: 'border-l-4 border-l-amber-500',
    stone: 'border-l-4 border-l-stone-700',
    blue: 'border-l-4 border-l-blue-600'
  }[accent];

  const iconBgClasses = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
    amber: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/60',
    stone: 'bg-stone-100 text-stone-800 ring-1 ring-stone-200',
    blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60'
  }[accent];

  return (
    <div className={`bg-white rounded-2xl border border-stone-200/80 ${accentBorder} p-5 shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between group`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] uppercase tracking-wider font-bold text-stone-500 block mb-1.5 truncate">
            {lang === 'mr' ? labelMr : labelEn}
          </span>
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 tabular-nums">
            {value}
          </div>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105 duration-200 ${iconBgClasses}`}>
          {icon}
        </div>
      </div>

      {(subtextEn || subtextMr) && (
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-1.5 text-xs text-stone-500 font-medium leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0" />
          <span className="truncate">{lang === 'mr' ? subtextMr : subtextEn}</span>
        </div>
      )}
    </div>
  );
};

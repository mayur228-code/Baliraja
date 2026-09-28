import type { FC } from 'react';

/**
 * Lightweight, GPU-Friendly Agricultural Background.
 * - ZERO continuous blur recalculations (uses pre-rasterized CSS radial gradients).
 * - ZERO SVG path string morphing (uses fixed elegant contour geometries).
 * - Ambient tones connected to Baliraja: soft emerald, sunlit amber, fresh lime.
 * - Consumes virtually 0% CPU/GPU overhead, ensuring 60/120fps carousel performance.
 */
export const FieldVisitsBackground: FC = () => {
  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      {/* ── 1. Soft Pre-Rasterized Ambient Radial Gradients (No heavy runtime blur filters) ── */}
      <div 
        className="absolute -top-16 -left-16 w-[450px] sm:w-[600px] h-[450px] sm:h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 45%, transparent 70%)',
        }}
      />

      <div 
        className="absolute -bottom-20 -right-20 w-[450px] sm:w-[620px] h-[450px] sm:h-[620px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.10) 0%, rgba(245, 158, 11, 0.03) 40%, transparent 68%)',
        }}
      />

      <div 
        className="absolute top-1/3 left-1/4 w-[350px] sm:w-[480px] h-[350px] sm:h-[480px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(132, 204, 22, 0.07) 0%, transparent 65%)',
        }}
      />

      {/* ── 2. Static Agricultural Contour Lines / Terrace Waves (Zero CPU path parsing) ── */}
      <div className="absolute inset-0 opacity-[0.05] mix-blend-multiply">
        <svg 
          className="w-full h-full object-cover" 
          viewBox="0 0 1200 600" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          {/* Topographic field terraces */}
          <path
            d="M-50,150 C200,80 450,220 700,130 C950,40 1100,180 1250,120"
            stroke="#065f46"
            strokeWidth="1.5"
            strokeDasharray="6 8"
          />
          <path
            d="M-50,320 C180,260 420,380 680,300 C920,220 1150,340 1250,290"
            stroke="#047857"
            strokeWidth="1.5"
          />
          <path
            d="M-50,480 C240,420 480,530 750,460 C1000,390 1180,490 1250,450"
            stroke="#b45309"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        </svg>
      </div>

      {/* ── 3. Subtle Floating Agricultural Seed / Light Motes ── */}
      <div className="absolute top-[22%] left-[14%] w-2 h-2 rounded-full bg-emerald-600/18" />
      <div className="absolute top-[68%] left-[18%] w-1.5 h-1.5 rounded-full bg-amber-500/22" />
      <div className="absolute top-[32%] right-[16%] w-2.5 h-2.5 rounded-full bg-emerald-500/15" />
      <div className="absolute top-[76%] right-[22%] w-1.5 h-1.5 rounded-full bg-amber-600/18" />
      <div className="absolute top-[50%] left-[48%] w-2 h-2 rounded-full bg-teal-500/12" />
    </div>
  );
};

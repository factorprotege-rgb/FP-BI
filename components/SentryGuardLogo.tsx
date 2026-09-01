
import React from 'react';

export const SentryGuardLogo = ({ className = "h-10" }: { className?: string }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    {/* Modern Shield Icon with Key/Data Bars */}
    <svg className="h-full w-auto aspect-square text-[#1a73e8] dark:text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.15" />
      <path d="M12 8v4" strokeLinecap="round" />
      <path d="M12 16h.01" strokeWidth="3" strokeLinecap="round" />
    </svg>
    <div className="flex flex-col justify-center leading-none">
      <span className="text-base font-extrabold tracking-tight text-slate-800 dark:text-white uppercase font-sans">
        FACTOR <span className="text-[#1a73e8] dark:text-brand-400">PROTEGE</span>
      </span>
      <span className="text-[8px] font-bold tracking-widest text-[#5f6368] dark:text-slate-400 uppercase font-mono mt-0.5">
        Security BI
      </span>
    </div>
  </div>
);

export default SentryGuardLogo;


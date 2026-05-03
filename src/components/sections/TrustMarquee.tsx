import React from 'react';
import { Building2, Globe, Cpu, ShieldCheck, TrendingUp, Cloud } from 'lucide-react';

const LOGOS = [
  { icon: Building2, name: 'Stripe' },
  { icon: Globe, name: 'Vercel' },
  { icon: Cpu, name: 'Nvidia' },
  { icon: ShieldCheck, name: 'Cloudflare' },
  { icon: TrendingUp, name: 'McKinsey' },
  { icon: Cloud, name: 'AWS' },
];

export const TrustMarquee = () => {
  return (
    <div className="w-full py-16 bg-neutral border-b border-white/5 overflow-hidden relative">
      <div className="container mx-auto px-4 mb-8 text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Trusted by Industry Leaders</p>
      </div>
      
      {/* Premium Fade Mask for Marquee edges */}
      <div className="relative flex overflow-x-hidden group [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <div className="animate-marquee whitespace-nowrap flex items-center space-x-16 px-8">
          {[...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS].map((logo, idx) => (
            <div key={`orig-${idx}`} className="inline-flex items-center space-x-3 text-slate-400 hover:text-white transition-all opacity-60 hover:opacity-100 hover:scale-105 duration-500">
              <logo.icon className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold tracking-tight">{logo.name}</span>
            </div>
          ))}
        </div>

        <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex items-center space-x-16 px-8">
          {[...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS].map((logo, idx) => (
            <div key={`dup-${idx}`} className="inline-flex items-center space-x-3 text-slate-400 hover:text-white transition-all opacity-60 hover:opacity-100 hover:scale-105 duration-500">
              <logo.icon className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold tracking-tight">{logo.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* CSS for Tailwind config (inline for portability in this snippet, but ideally in tailwind.config.js) */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        @keyframes marquee2 {
          0% { transform: translateX(100%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee2 {
          animation: marquee2 40s linear infinite;
        }
        .group:hover .animate-marquee,
        .group:hover .animate-marquee2 {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

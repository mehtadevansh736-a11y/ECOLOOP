'use client';

import Link from 'next/link';
import { Recycle, Camera, Sparkles, User, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-3 flex items-center justify-between">
      {/* Mobile Brand Logo */}
      <div className="flex items-center gap-3 md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center">
            <Recycle className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">EcoLoop</span>
        </Link>
      </div>

      {/* Title / Search placeholder */}
      <div className="hidden md:flex items-center gap-2 text-slate-500 text-xs font-medium bg-slate-100/70 px-3 py-1.5 rounded-full border border-slate-200">
        <ShieldCheck className="w-4 h-4 text-brand-600" />
        <span>AI Circular Economy Platform Active</span>
      </div>

      {/* Right User Bar */}
      <div className="flex items-center gap-3 ml-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold border border-brand-200">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>120 Eco Points</span>
        </div>

        <Link
          href="/profile"
          className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[11px]">
            EP
          </div>
          <span className="hidden sm:inline">Eco Pioneer</span>
        </Link>
      </div>
    </header>
  );
}

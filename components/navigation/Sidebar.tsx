'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Camera, 
  Repeat, 
  Sprout, 
  MapPin, 
  Trophy, 
  User, 
  Recycle,
  Sparkles,
  LogOut
} from 'lucide-react';
import { clsx } from 'clsx';

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scanner', label: 'AI Scanner', icon: Camera, badge: 'AI' },
  { href: '/marketplace', label: 'Marketplace', icon: Repeat },
  { href: '/impact', label: 'My Impact', icon: Sprout },
  { href: '/centers', label: 'Circular Centers', icon: MapPin },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen sticky top-0 z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Recycle className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-slate-900 tracking-tight flex items-center gap-1.5">
              EcoLoop
              <span className="w-2 h-2 rounded-full bg-brand-500"></span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Circular Economy AI</p>
          </div>
        </Link>
      </div>

      {/* Quick Action CTA */}
      <div className="p-4">
        <Link 
          href="/scanner"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-sm hover:shadow transition-all group"
        >
          <Sparkles className="w-4 h-4 text-brand-200 group-hover:rotate-12 transition-transform" />
          <span>Scan Item with AI</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150',
                isActive
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={clsx('w-5 h-5', isActive ? 'text-brand-600' : 'text-slate-400')} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-100 text-brand-700 uppercase tracking-wider">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center">
        <p className="font-medium text-slate-500">EcoLoop Hackathon MVP</p>
        <p className="text-[11px] mt-0.5">Give Every Item a Second Life</p>
      </div>
    </aside>
  );
}

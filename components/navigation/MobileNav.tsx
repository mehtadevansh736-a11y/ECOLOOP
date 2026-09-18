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
  User 
} from 'lucide-react';
import { clsx } from 'clsx';

const MOBILE_NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/marketplace', label: 'Market', icon: Repeat },
  { href: '/scanner', label: 'Scan', icon: Camera, isCenter: true },
  { href: '/impact', label: 'Impact', icon: Sprout },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 shadow-lg">
      <nav className="flex items-center justify-around">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-5 flex flex-col items-center group"
              >
                <div className="w-13 h-13 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/30 border-4 border-slate-50 group-active:scale-95 transition-all p-3">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-brand-700 mt-1">Scan</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex flex-col items-center py-1 px-3 rounded-lg transition-colors',
                isActive ? 'text-brand-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

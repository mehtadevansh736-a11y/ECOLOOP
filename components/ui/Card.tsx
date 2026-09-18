import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: 'default' | 'flat' | 'outline' | 'glass';
}

export function Card({
  children,
  className,
  variant = 'default',
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-white border border-slate-200/80 shadow-xs rounded-2xl p-6',
    flat: 'bg-slate-50 border border-slate-100 rounded-2xl p-6',
    outline: 'bg-white border-2 border-slate-200 rounded-2xl p-6',
    glass: 'bg-white/80 backdrop-blur-md border border-slate-200/70 shadow-xs rounded-2xl p-6',
  };

  return (
    <div className={clsx(variants[variant], className)} {...props}>
      {children}
    </div>
  );
}

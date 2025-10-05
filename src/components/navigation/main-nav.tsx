"use client";

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export type NavItem = {
  href: string;
  label: string;
};

export function MainNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (!items.length) {
    return null;
  }

  return (
    <div className="w-full sm:w-auto">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 sm:hidden"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="main-nav-links"
      >
        <span>{isOpen ? 'Đóng menu' : 'Mở menu'}</span>
        <span className="text-base">{isOpen ? '-' : '+'}</span>
      </button>
      <nav
        id="main-nav-links"
        className={clsx(
          'mt-2 flex flex-col gap-2 sm:mt-0 sm:flex-row sm:items-center sm:gap-3',
          isOpen ? 'flex' : 'hidden sm:flex',
        )}
      >
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                active
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

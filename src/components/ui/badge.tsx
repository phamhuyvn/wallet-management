import clsx from 'clsx';
import { ReactNode } from 'react';

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700',
        className,
      )}
    >
      {children}
    </span>
  );
}

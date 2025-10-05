import clsx from 'clsx';
import { ReactNode } from 'react';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6', className)}>{children}</div>;
}

export function CardHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4 space-y-1">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description ? <p className="text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

export function CardContent({ children }: { children: ReactNode }) {
  return <div className="space-y-3 text-sm text-slate-700">{children}</div>;
}

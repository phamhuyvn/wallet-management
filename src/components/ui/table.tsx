import clsx from 'clsx';
import { ReactNode } from 'react';

export function TableContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('overflow-x-auto overscroll-x-contain', className)}>{children}</div>;
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <table className={clsx('min-w-[560px] table-fixed border-separate border-spacing-0 text-left text-sm text-slate-700', className)}>
      {children}
    </table>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="bg-white text-sm text-slate-700">{children}</tbody>;
}

export function TRow({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={clsx('transition hover:bg-emerald-50/40', className)}>{children}</tr>;
}

export function TCell({
  children,
  className,
  colSpan,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td className={clsx('border-b border-slate-100 px-4 py-3 align-top text-sm text-slate-700', className)} colSpan={colSpan}>
      {children}
    </td>
  );
}

export function THeadCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={clsx('border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500', className)}
    >
      {children}
    </th>
  );
}

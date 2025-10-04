import clsx from 'clsx';
import { ReactNode } from 'react';

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return <table className={clsx('min-w-full divide-y divide-slate-200 text-sm', className)}>{children}</table>;
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-slate-100 text-left text-xs uppercase tracking-wider text-slate-600">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">{children}</tbody>;
}

export function TRow({ children }: { children: ReactNode }) {
  return <tr className="hover:bg-slate-50">{children}</tr>;
}

export function TCell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={clsx('px-4 py-3 align-middle', className)}>{children}</td>;
}

export function THeadCell({ children, className }: { children: ReactNode; className?: string }) {
  return <th scope="col" className={clsx('px-4 py-3 font-semibold', className)}>{children}</th>;
}

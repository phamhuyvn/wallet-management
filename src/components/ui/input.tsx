import clsx from 'clsx';
import { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={clsx(
        'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400',
        'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400',
        className,
      )}
      {...props}
    />
  );
}

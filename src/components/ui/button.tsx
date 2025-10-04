import clsx from 'clsx';
import { ButtonHTMLAttributes } from 'react';

const variants = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-400',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:text-slate-900',
  ghost: 'text-slate-600 hover:bg-slate-200/70',
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

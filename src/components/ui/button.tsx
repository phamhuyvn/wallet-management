import clsx from 'clsx';
import { ButtonHTMLAttributes } from 'react';

const variants = {
  primary:
    'bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-400 active:bg-emerald-700',
  secondary:
    'bg-white text-emerald-700 border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 focus-visible:ring-emerald-200',
  ghost:
    'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-200',
} as const;

const sizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

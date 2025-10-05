import clsx from 'clsx';
import { LabelHTMLAttributes } from 'react';

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return <label className={clsx('block text-sm font-semibold text-slate-700', className)} {...props} />;
}

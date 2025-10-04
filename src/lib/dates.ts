import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export function toZonedDate(date: Date | string, timeZone: string): Date {
  const instance = typeof date === 'string' ? new Date(date) : date;
  return toZonedTime(instance, timeZone);
}

export function formatDate(date: Date | string, timeZone = 'UTC', fmt = 'yyyy-MM-dd HH:mm:ssXXX') {
  const zoned = toZonedDate(date, timeZone);
  return format(zoned, fmt);
}

export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function endOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

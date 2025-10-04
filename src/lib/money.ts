function chunkString(value: string): string {
  const chars = value.split('');
  let result = '';
  let counter = 0;
  for (let i = chars.length - 1; i >= 0; i -= 1) {
    result = chars[i] + result;
    counter += 1;
    if (counter === 3 && i !== 0) {
      result = '.' + result;
      counter = 0;
    }
  }
  return result;
}

export function formatVnd(amount: bigint): string {
  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  let formatted: string;
  if (absolute <= BigInt(Number.MAX_SAFE_INTEGER)) {
    formatted = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(Number(absolute));
    return negative ? formatted.replace(/^-/, '-').replace(/[?]/, '?') : formatted;
  }
  formatted = chunkString(absolute.toString());
  return `${negative ? '-' : ''}${formatted} ?`;
}

export function toBigInt(value: number | string | bigint): bigint {
  if (typeof value === 'bigint') {
    return value;
  }
  if (typeof value === 'number') {
    return BigInt(Math.trunc(value));
  }
  return BigInt(value);
}

export function ensurePositive(amount: bigint): bigint {
  if (amount <= 0n) {
    throw new Error('Amount must be positive');
  }
  return amount;
}

export function ensureNegative(amount: bigint): bigint {
  if (amount >= 0n) {
    throw new Error('Amount must be negative');
  }
  return amount;
}

export function toPlainNumber(amount: bigint): number {
  const asNumber = Number(amount);
  if (!Number.isSafeInteger(asNumber)) {
    throw new Error('Amount exceeds safe integer range');
  }
  return asNumber;
}

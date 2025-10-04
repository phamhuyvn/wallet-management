import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { AppError } from '@/lib/errors';

const convertValue = (value: unknown): unknown => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => convertValue(item));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, convertValue(val)]),
    ) as Record<string, unknown>;
  }
  return value;
};

export function jsonResponse<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data: convertValue(data) }, init);
}

export function emptyResponse(status = 204) {
  return new NextResponse(null, { status });
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          status: error.status,
        },
      },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          message: 'Validation error',
          details: error.flatten(),
          status: 422,
        },
      },
      { status: 422 },
    );
  }
  console.error('Unexpected API error', error);
  return NextResponse.json(
    {
      error: {
        message: 'Internal server error',
        status: 500,
      },
    },
    { status: 500 },
  );
}

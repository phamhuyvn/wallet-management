"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function BranchCreateForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Tên chi nhánh cần tối thiểu 2 ký tự.');
      return;
    }
    startTransition(async () => {
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error?.message ?? 'Không thể tạo chi nhánh.');
        return;
      }
      setName('');
      router.refresh();
      onSuccess?.();
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="branch-name">Tên chi nhánh</Label>
        <Input
          id="branch-name"
          placeholder="VD: Chi nhánh Hà Nội"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <p className="text-xs text-slate-500">Tên phải là duy nhất trong toàn hệ thống.</p>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? 'Đang tạo...' : 'Tạo chi nhánh'}
        </Button>
      </div>
    </form>
  );
}

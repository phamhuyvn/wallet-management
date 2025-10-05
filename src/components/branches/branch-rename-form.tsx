"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function BranchRenameForm({
  branchId,
  initialName,
  onSuccess,
}: {
  branchId: string;
  initialName: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
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
      const response = await fetch(`/api/branches/${branchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error?.message ?? 'Không thể cập nhật chi nhánh.');
        return;
      }
      router.refresh();
      onSuccess?.();
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="rename-branch">Tên chi nhánh</Label>
        <Input
          id="rename-branch"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? 'Đang lưu...' : 'Cập nhật'}
        </Button>
      </div>
    </form>
  );
}

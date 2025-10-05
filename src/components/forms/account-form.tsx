"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const ACCOUNT_TYPES = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng' },
] as const;

type AccountType = (typeof ACCOUNT_TYPES)[number]['value'];

type BranchOption = {
  id: string;
  name: string;
};

type AccountFormProps = {
  branches: BranchOption[];
  onSuccess?: () => void;
  defaultBranchId?: string;
  disableBranchSelection?: boolean;
};

export function AccountForm({
  branches,
  onSuccess,
  defaultBranchId,
  disableBranchSelection = false,
}: AccountFormProps) {
  const router = useRouter();
  const initialBranchId = defaultBranchId ?? branches[0]?.id ?? '';
  const [formState, setFormState] = useState<{
    branchId: string;
    name: string;
    type: AccountType;
  }>({
    branchId: initialBranchId,
    name: '',
    type: ACCOUNT_TYPES[0]?.value ?? 'CASH',
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!formState.branchId || !formState.name) {
      setError('Vui lòng chọn chi nhánh và nhập tên tài khoản.');
      return;
    }
    const payload = {
      branchId: formState.branchId,
      name: formState.name,
      type: formState.type,
    };
    startTransition(async () => {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error?.message ?? 'Không thể tạo tài khoản.');
        return;
      }
      setFormState({
        branchId: defaultBranchId ?? branches[0]?.id ?? '',
        name: '',
        type: ACCOUNT_TYPES[0]?.value ?? 'CASH',
      });
      router.refresh();
      onSuccess?.();
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="account-branch">Chi nhánh</Label>
        <Select
          id="account-branch"
          value={formState.branchId}
          onChange={(event) => setFormState((prev) => ({ ...prev, branchId: event.target.value }))}
          required
          disabled={disableBranchSelection}
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </Select>
        {disableBranchSelection ? (
          <p className="text-xs text-slate-500">Tài khoản mới sẽ gắn với chi nhánh này.</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="account-name">Tên tài khoản</Label>
        <Input
          id="account-name"
          placeholder="Ví tiền mặt quầy"
          required
          value={formState.name}
          onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="account-type">Loại tài khoản</Label>
        <Select
          id="account-type"
          value={formState.type}
          onChange={(event) => setFormState((prev) => ({ ...prev, type: event.target.value as AccountType }))}
          required
        >
          {ACCOUNT_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? 'Đang lưu...' : 'Tạo tài khoản'}
        </Button>
      </div>
    </form>
  );
}

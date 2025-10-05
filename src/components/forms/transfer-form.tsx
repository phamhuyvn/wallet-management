"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type AccountOption = {
  id: string;
  name: string;
  branchId: string;
  branchName?: string;
};

export function TransferForm({ accounts, onSuccess }: { accounts: AccountOption[]; onSuccess?: () => void }) {
  const router = useRouter();
  const [formState, setFormState] = useState({
    fromAccountId: accounts[0]?.id ?? '',
    toAccountId: accounts[1]?.id ?? accounts[0]?.id ?? '',
    amount: '',
    allowCrossBranch: false,
    note: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!formState.fromAccountId || !formState.toAccountId || !formState.amount) {
      setError('Vui lòng điền đầy đủ thông tin chuyển tiền.');
      return;
    }
    if (formState.fromAccountId === formState.toAccountId) {
      setError('Tài khoản nguồn và đích phải khác nhau.');
      return;
    }
    const payload = {
      fromAccountId: formState.fromAccountId,
      toAccountId: formState.toAccountId,
      amount: formState.amount,
      note: formState.note || undefined,
      allowCrossBranch: formState.allowCrossBranch || undefined,
    };
    startTransition(async () => {
      const response = await fetch('/api/transactions/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error?.message ?? 'Chuyển khoản thất bại.');
        return;
      }
      setFormState({
        fromAccountId: accounts[0]?.id ?? '',
        toAccountId: accounts[1]?.id ?? accounts[0]?.id ?? '',
        amount: '',
        allowCrossBranch: false,
        note: '',
      });
      router.refresh();
      onSuccess?.();
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="transfer-from">Từ tài khoản</Label>
          <select
            id="transfer-from"
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={formState.fromAccountId}
            onChange={(event) => setFormState((prev) => ({ ...prev, fromAccountId: event.target.value }))}
            required
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
                {account.branchName ? ` - ${account.branchName}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="transfer-to">Đến tài khoản</Label>
          <select
            id="transfer-to"
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={formState.toAccountId}
            onChange={(event) => setFormState((prev) => ({ ...prev, toAccountId: event.target.value }))}
            required
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
                {account.branchName ? ` - ${account.branchName}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="transfer-amount">Số tiền (VND)</Label>
        <Input
          id="transfer-amount"
          inputMode="numeric"
          pattern="^[0-9]+$"
          placeholder="500000"
          title="Nhập số tiền bằng chữ số."
          required
          value={formState.amount}
          onChange={(event) => setFormState((prev) => ({ ...prev, amount: event.target.value }))}
        />
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          id="allow-cross-branch"
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
          checked={formState.allowCrossBranch}
          onChange={(event) => setFormState((prev) => ({ ...prev, allowCrossBranch: event.target.checked }))}
        />
        <Label htmlFor="allow-cross-branch" className="text-sm font-normal text-slate-600">
          Cho phép chuyển khác chi nhánh
        </Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="transfer-note">Ghi chú</Label>
        <Textarea
          id="transfer-note"
          rows={3}
          value={formState.note}
          onChange={(event) => setFormState((prev) => ({ ...prev, note: event.target.value }))}
          placeholder="Ví dụ: Bổ sung quỹ chi nhánh B"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? 'Đang xử lý...' : 'Thực hiện chuyển tiền'}
        </Button>
      </div>
    </form>
  );
}

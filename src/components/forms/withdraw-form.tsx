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
  branchName?: string;
};

export function WithdrawForm({ accounts, onSuccess }: { accounts: AccountOption[]; onSuccess?: () => void }) {
  const router = useRouter();
  const [formState, setFormState] = useState({ accountId: accounts[0]?.id ?? '', amount: '', note: '' });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!formState.accountId || !formState.amount) {
      setError('Vui lòng chọn tài khoản và nhập số tiền.');
      return;
    }
    const payload = {
      accountId: formState.accountId,
      amount: formState.amount,
      note: formState.note || undefined,
    };
    startTransition(async () => {
      const response = await fetch('/api/transactions/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error?.message ?? 'Xuất quỹ thất bại.');
        return;
      }
      setFormState({ accountId: accounts[0]?.id ?? '', amount: '', note: '' });
      router.refresh();
      onSuccess?.();
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="withdraw-account">Tài khoản chi</Label>
        <select
          id="withdraw-account"
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          value={formState.accountId}
          onChange={(event) => setFormState((prev) => ({ ...prev, accountId: event.target.value }))}
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
        <Label htmlFor="withdraw-amount">Số tiền (VND)</Label>
        <Input
          id="withdraw-amount"
          inputMode="numeric"
          pattern="^[0-9]+$"
          placeholder="150000"
          title="Nhập số tiền bằng chữ số."
          required
          value={formState.amount}
          onChange={(event) => setFormState((prev) => ({ ...prev, amount: event.target.value }))}
        />
        <p className="text-xs text-slate-500">Nhập số tiền cần xuất quỹ (số nguyên dương).</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="withdraw-note">Ghi chú</Label>
        <Textarea
          id="withdraw-note"
          rows={3}
          value={formState.note}
          onChange={(event) => setFormState((prev) => ({ ...prev, note: event.target.value }))}
          placeholder="Ví dụ: Chi tiền mặt mua văn phòng phẩm"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? 'Đang xử lý...' : 'Xác nhận xuất quỹ'}
        </Button>
      </div>
    </form>
  );
}

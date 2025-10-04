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

export function DepositForm({ accounts, onSuccess }: { accounts: AccountOption[]; onSuccess?: () => void }) {
  const router = useRouter();
  const [formState, setFormState] = useState({ accountId: accounts[0]?.id ?? '', amount: '', note: '' });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!formState.accountId || !formState.amount) {
      setError('Account and amount are required');
      return;
    }
    const payload = {
      accountId: formState.accountId,
      amount: formState.amount,
      note: formState.note || undefined,
    };
    startTransition(async () => {
      const response = await fetch('/api/transactions/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error?.message ?? 'Deposit failed');
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
        <Label htmlFor="deposit-account">Account</Label>
        <select
          id="deposit-account"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          value={formState.accountId}
          onChange={(event) => setFormState((prev) => ({ ...prev, accountId: event.target.value }))}
          required
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
              {account.branchName ? ` ? ${account.branchName}` : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="deposit-amount">Amount (VND)</Label>
        <Input
          id="deposit-amount"
          inputMode="numeric"
          pattern="^[0-9]+$"
          placeholder="100000"
          required
          value={formState.amount}
          onChange={(event) => setFormState((prev) => ({ ...prev, amount: event.target.value }))}
        />
        <p className="text-xs text-slate-500">Enter the amount in ??ng (no decimals).</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="deposit-note">Note</Label>
        <Textarea
          id="deposit-note"
          rows={3}
          value={formState.note}
          onChange={(event) => setFormState((prev) => ({ ...prev, note: event.target.value }))}
          placeholder="Optional note"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Processing?' : 'Deposit'}
        </Button>
      </div>
    </form>
  );
}

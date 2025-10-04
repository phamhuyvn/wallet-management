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
      setError('All fields are required');
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
        setError(body.error?.message ?? 'Transfer failed');
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
          <Label htmlFor="transfer-from">From account</Label>
          <select
            id="transfer-from"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={formState.fromAccountId}
            onChange={(event) => setFormState((prev) => ({ ...prev, fromAccountId: event.target.value }))}
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
          <Label htmlFor="transfer-to">To account</Label>
          <select
            id="transfer-to"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={formState.toAccountId}
            onChange={(event) => setFormState((prev) => ({ ...prev, toAccountId: event.target.value }))}
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
      </div>
      <div className="space-y-2">
        <Label htmlFor="transfer-amount">Amount (VND)</Label>
        <Input
          id="transfer-amount"
          inputMode="numeric"
          pattern="^[0-9]+$"
          placeholder="100000"
          required
          value={formState.amount}
          onChange={(event) => setFormState((prev) => ({ ...prev, amount: event.target.value }))}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="allow-cross-branch"
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          checked={formState.allowCrossBranch}
          onChange={(event) => setFormState((prev) => ({ ...prev, allowCrossBranch: event.target.checked }))}
        />
        <Label htmlFor="allow-cross-branch" className="text-sm text-slate-600">
          Allow cross-branch transfer
        </Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="transfer-note">Note</Label>
        <Textarea
          id="transfer-note"
          rows={3}
          value={formState.note}
          onChange={(event) => setFormState((prev) => ({ ...prev, note: event.target.value }))}
          placeholder="Optional note"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Processing?' : 'Transfer'}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'DEPOSIT', label: 'Deposit' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'WITHDRAW', label: 'Withdraw' },
  { value: 'ORDER_PAYMENT', label: 'Order payment' },
];

export function TransactionsFilters({
  branches,
  accounts,
  role,
  currentBranchId,
}: {
  branches: Array<{ id: string; name: string }>;
  accounts: Array<{ id: string; name: string; branchId: string }>;
  role: 'OWNER' | 'STAFF';
  currentBranchId?: string | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const initialBranch = params?.get('branchId') ?? currentBranchId ?? '';
  const [branchId, setBranchId] = useState(initialBranch);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => !branchId || account.branchId === branchId);
  }, [accounts, branchId]);

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const query = new URLSearchParams();
        const accountId = (data.get('accountId') as string) || '';
        const type = (data.get('type') as string) || '';
        const from = (data.get('from') as string) || '';
        const to = (data.get('to') as string) || '';
        if (branchId) query.set('branchId', branchId);
        if (accountId) query.set('accountId', accountId);
        if (type) query.set('type', type);
        if (from) query.set('from', from);
        if (to) query.set('to', to);
        router.replace(`/transactions${query.size ? `?${query.toString()}` : ''}`);
      }}
    >
      {role === 'OWNER' ? (
        <div className="flex min-w-[160px] flex-col gap-2">
          <Label htmlFor="branchId">Branch</Label>
          <Select id="branchId" name="branchId" value={branchId} onChange={(event) => setBranchId(event.target.value)}>
            <option value="">All branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
      <div className="flex min-w-[160px] flex-col gap-2">
        <Label htmlFor="accountId">Account</Label>
        <Select id="accountId" name="accountId" defaultValue={params?.get('accountId') ?? ''}>
          <option value="">All accounts</option>
          {filteredAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex min-w-[140px] flex-col gap-2">
        <Label htmlFor="type">Type</Label>
        <Select id="type" name="type" defaultValue={params?.get('type') ?? ''}>
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex min-w-[140px] flex-col gap-2">
        <Label htmlFor="from">From</Label>
        <Input id="from" name="from" type="date" defaultValue={params?.get('from') ?? ''} />
      </div>
      <div className="flex min-w-[140px] flex-col gap-2">
        <Label htmlFor="to">To</Label>
        <Input id="to" name="to" type="date" defaultValue={params?.get('to') ?? ''} />
      </div>
      <Button type="submit">Apply</Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setBranchId(initialBranch);
          router.replace('/transactions');
        }}
      >
        Reset
      </Button>
    </form>
  );
}

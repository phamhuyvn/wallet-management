"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const ACCOUNT_TYPES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
] as const;

type BranchOption = {
  id: string;
  name: string;
};

export function AccountForm({ branches, onSuccess }: { branches: BranchOption[]; onSuccess?: () => void }) {
  const router = useRouter();
  const [formState, setFormState] = useState({
    branchId: branches[0]?.id ?? '',
    name: '',
    type: ACCOUNT_TYPES[0]?.value ?? 'CASH',
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!formState.branchId || !formState.name) {
      setError('Branch and name are required');
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
        setError(body.error?.message ?? 'Failed to create account');
        return;
      }
      setFormState({ branchId: branches[0]?.id ?? '', name: '', type: ACCOUNT_TYPES[0]?.value ?? 'CASH' });
      router.refresh();
      onSuccess?.();
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="account-branch">Branch</Label>
        <Select
          id="account-branch"
          value={formState.branchId}
          onChange={(event) => setFormState((prev) => ({ ...prev, branchId: event.target.value }))}
          required
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="account-name">Account name</Label>
        <Input
          id="account-name"
          placeholder="Cash register"
          required
          value={formState.name}
          onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="account-type">Type</Label>
        <Select
          id="account-type"
          value={formState.type}
          onChange={(event) => setFormState((prev) => ({ ...prev, type: event.target.value }))}
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
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving?' : 'Create account'}
        </Button>
      </div>
    </form>
  );
}

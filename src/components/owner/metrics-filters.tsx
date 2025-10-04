"use client";

import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const GROUP_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'custom', label: 'Custom (no grouping)' },
];

export function MetricsFilters({
  initialFrom,
  initialTo,
  initialGroupBy,
}: {
  initialFrom: string;
  initialTo: string;
  initialGroupBy: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const query = new URLSearchParams(params?.toString() ?? '');
        const from = data.get('from')?.toString();
        const to = data.get('to')?.toString();
        const groupBy = data.get('groupBy')?.toString() ?? 'day';
        if (from) {
          query.set('from', from);
        } else {
          query.delete('from');
        }
        if (to) {
          query.set('to', to);
        } else {
          query.delete('to');
        }
        query.set('groupBy', groupBy);
        router.replace(`/owner?${query.toString()}`);
      }}
    >
      <div className="flex min-w-[150px] flex-1 flex-col gap-2">
        <Label htmlFor="from">From</Label>
        <Input id="from" name="from" type="date" defaultValue={initialFrom} />
      </div>
      <div className="flex min-w-[150px] flex-1 flex-col gap-2">
        <Label htmlFor="to">To</Label>
        <Input id="to" name="to" type="date" defaultValue={initialTo} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="groupBy">Group by</Label>
        <Select id="groupBy" name="groupBy" defaultValue={initialGroupBy}>
          {GROUP_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit">Apply</Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          const query = new URLSearchParams(params?.toString() ?? '');
          query.delete('from');
          query.delete('to');
          query.delete('groupBy');
          router.replace(`/owner${query.toString() ? `?${query.toString()}` : ''}`);
        }}
      >
        Reset
      </Button>
    </form>
  );
}

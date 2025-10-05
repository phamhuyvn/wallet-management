"use client";

import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const GROUP_OPTIONS = [
  { value: 'day', label: 'Ngày' },
  { value: 'month', label: 'Tháng' },
  { value: 'year', label: 'Năm' },
  { value: 'custom', label: 'Tùy chỉnh (không gộp)' },
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
      className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
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
        <Label htmlFor="from">Từ ngày</Label>
        <Input id="from" name="from" type="date" defaultValue={initialFrom} />
      </div>
      <div className="flex min-w-[150px] flex-1 flex-col gap-2">
        <Label htmlFor="to">Đến ngày</Label>
        <Input id="to" name="to" type="date" defaultValue={initialTo} />
      </div>
      <div className="flex min-w-[170px] flex-col gap-2">
        <Label htmlFor="groupBy">Gộp theo</Label>
        <Select id="groupBy" name="groupBy" defaultValue={initialGroupBy}>
          {GROUP_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" size="sm">
        Áp dụng
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          const query = new URLSearchParams(params?.toString() ?? '');
          query.delete('from');
          query.delete('to');
          query.delete('groupBy');
          router.replace(`/owner${query.toString() ? `?${query.toString()}` : ''}`);
        }}
      >
        Xóa bộ lọc
      </Button>
    </form>
  );
}

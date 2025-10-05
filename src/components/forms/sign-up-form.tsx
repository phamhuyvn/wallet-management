"use client";

import { useRouter } from 'next/navigation';
import { FormEvent, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const ROLE_OPTIONS = [
  { value: 'STAFF', label: 'Nhân viên' },
  { value: 'OWNER', label: 'Chủ sở hữu' },
] as const;

type BranchOption = {
  id: string;
  name: string;
};

export function SignUpForm({
  branches,
  isFirstUser,
}: {
  branches: BranchOption[];
  isFirstUser: boolean;
}) {
  const router = useRouter();
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    fullName: '',
    branchId: branches[0]?.id ?? '',
    role: isFirstUser ? 'OWNER' : 'STAFF',
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const payload: Record<string, unknown> = {
      email: formState.email,
      password: formState.password,
      fullName: formState.fullName,
    };
    if (!isFirstUser) {
      payload.role = formState.role;
      if (formState.role === 'STAFF') {
        payload.branchId = formState.branchId;
      }
    }
    startTransition(async () => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error?.message ?? 'Đăng ký không thành công.');
        return;
      }
      router.push('/sign-in');
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="full-name">Họ và tên</Label>
        <Input
          id="full-name"
          placeholder="Nguyễn Văn A"
          required
          value={formState.fullName}
          onChange={(event) => setFormState((prev) => ({ ...prev, fullName: event.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email công việc</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="ban@congty.vn"
          required
          value={formState.email}
          onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Mật khẩu</Label>
        <Input
          id="signup-password"
          type="password"
          minLength={8}
          placeholder="Tối thiểu 8 ký tự"
          required
          value={formState.password}
          onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
        />
        <p className="text-xs text-slate-500">Tối thiểu 8 ký tự, nên kết hợp chữ và số.</p>
      </div>
      {!isFirstUser ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="signup-role">Vai trò</Label>
            <Select
              id="signup-role"
              value={formState.role}
              onChange={(event) => setFormState((prev) => ({ ...prev, role: event.target.value }))}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          {formState.role === 'STAFF' ? (
            <div className="space-y-2">
              <Label htmlFor="signup-branch">Chi nhánh làm việc</Label>
              <Select
                id="signup-branch"
                value={formState.branchId}
                onChange={(event) => setFormState((prev) => ({ ...prev, branchId: event.target.value }))}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
        </>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
      </Button>
    </form>
  );
}

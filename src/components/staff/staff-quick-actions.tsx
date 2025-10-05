"use client";

import { useState } from 'react';

import { DepositForm } from '@/components/forms/deposit-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export function StaffQuickActions({ accounts }: { accounts: Array<{ id: string; name: string }> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        Nạp tiền nhanh
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nạp tiền vào tài khoản">
        <DepositForm accounts={accounts} onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}

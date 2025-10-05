"use client";

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

import { BranchCreateForm } from './branch-create-form';

export function BranchCreateButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Thêm chi nhánh
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Tạo chi nhánh mới">
        <BranchCreateForm onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}

"use client";

import { useState } from 'react';

import { AccountForm } from '@/components/forms/account-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

import { BranchRenameForm } from './branch-rename-form';

type BranchRowActionsProps = {
  branchId: string;
  branchName: string;
};

export function BranchRowActions({ branchId, branchName }: BranchRowActionsProps) {
  const [openModal, setOpenModal] = useState<null | 'rename' | 'account'>(null);
  const close = () => setOpenModal(null);

  const branchOption = [{ id: branchId, name: branchName }];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpenModal('rename')}>
          Đổi tên
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setOpenModal('account')}>
          Thêm tài khoản
        </Button>
      </div>

      <Modal open={openModal === 'rename'} onClose={close} title="Đổi tên chi nhánh">
        <BranchRenameForm branchId={branchId} initialName={branchName} onSuccess={close} />
      </Modal>

      <Modal open={openModal === 'account'} onClose={close} title="Tạo tài khoản cho chi nhánh">
        <AccountForm
          branches={branchOption}
          defaultBranchId={branchId}
          disableBranchSelection
          onSuccess={close}
        />
      </Modal>
    </>
  );
}

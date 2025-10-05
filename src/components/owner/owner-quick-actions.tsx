"use client";

import { useState } from 'react';

import { AccountForm } from '@/components/forms/account-form';
import { DepositForm } from '@/components/forms/deposit-form';
import { OrderPaymentForm } from '@/components/forms/order-payment-form';
import { TransferForm } from '@/components/forms/transfer-form';
import { WithdrawForm } from '@/components/forms/withdraw-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export function OwnerQuickActions({
  accounts,
  branches,
}: {
  accounts: Array<{ id: string; name: string; branchId: string; branchName: string }>;
  branches: Array<{ id: string; name: string }>;
}) {
  const [openModal, setOpenModal] = useState<null | 'transfer' | 'withdraw' | 'order' | 'account' | 'deposit'>(null);
  const close = () => setOpenModal(null);

  const accountOptions = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    branchId: account.branchId,
    branchName: account.branchName,
  }));

  return (
    <div className="flex flex-wrap gap-2 sm:justify-end">
      <Button variant="primary" size="sm" onClick={() => setOpenModal('transfer')} disabled={accounts.length < 2}>
        Chuyển khoản nội bộ
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setOpenModal('withdraw')} disabled={accounts.length === 0}>
        Xuất quỹ
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setOpenModal('order')} disabled={accounts.length === 0}>
        Thanh toán đơn hàng
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setOpenModal('deposit')} disabled={accounts.length === 0}>
        Nạp tiền
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setOpenModal('account')} disabled={branches.length === 0}>
        Tạo tài khoản mới
      </Button>

      <Modal open={openModal === 'transfer'} onClose={close} title="Chuyển khoản giữa các ví">
        <TransferForm accounts={accounts} onSuccess={close} />
      </Modal>

      <Modal open={openModal === 'withdraw'} onClose={close} title="Xuất quỹ tiền mặt">
        <WithdrawForm accounts={accountOptions} onSuccess={close} />
      </Modal>

      <Modal open={openModal === 'order'} onClose={close} title="Thanh toán đơn hàng">
        <OrderPaymentForm accounts={accountOptions} onSuccess={close} />
      </Modal>

      <Modal open={openModal === 'deposit'} onClose={close} title="Nạp tiền vào tài khoản">
        <DepositForm accounts={accountOptions} onSuccess={close} />
      </Modal>

      <Modal open={openModal === 'account'} onClose={close} title="Tạo tài khoản quản lý mới">
        <AccountForm branches={branches} onSuccess={close} />
      </Modal>
    </div>
  );
}

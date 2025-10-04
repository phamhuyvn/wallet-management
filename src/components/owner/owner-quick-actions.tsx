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
    <div className="flex flex-wrap gap-3">
      <Button variant="primary" onClick={() => setOpenModal('transfer')} disabled={accounts.length < 2}>
        Transfer
      </Button>
      <Button variant="secondary" onClick={() => setOpenModal('withdraw')} disabled={accounts.length === 0}>
        Withdraw
      </Button>
      <Button variant="secondary" onClick={() => setOpenModal('order')} disabled={accounts.length === 0}>
        Pay Order
      </Button>
      <Button variant="ghost" onClick={() => setOpenModal('deposit')} disabled={accounts.length === 0}>
        Deposit
      </Button>
      <Button variant="ghost" onClick={() => setOpenModal('account')} disabled={branches.length === 0}>
        New Account
      </Button>

      <Modal open={openModal === 'transfer'} onClose={close} title="Transfer between accounts">
        <TransferForm accounts={accounts} onSuccess={close} />
      </Modal>

      <Modal open={openModal === 'withdraw'} onClose={close} title="Withdraw cash">
        <WithdrawForm accounts={accountOptions} onSuccess={close} />
      </Modal>

      <Modal open={openModal === 'order'} onClose={close} title="Pay for order">
        <OrderPaymentForm accounts={accountOptions} onSuccess={close} />
      </Modal>

      <Modal open={openModal === 'deposit'} onClose={close} title="Deposit into account">
        <DepositForm accounts={accountOptions} onSuccess={close} />
      </Modal>

      <Modal open={openModal === 'account'} onClose={close} title="Create new account">
        <AccountForm branches={branches} onSuccess={close} />
      </Modal>
    </div>
  );
}

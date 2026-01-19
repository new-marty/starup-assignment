'use client';

import { useAtomValue } from 'jotai';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { groupAtom, membersAtom } from '@/atoms';
import { ExpenseList } from '@/components/expense/expense-list';
import { AddExpenseForm } from '@/components/expense/add-expense-form';
import { BalanceSummary } from '@/components/settlement/balance-summary';
import { SettlementList } from '@/components/settlement/settlement-list';
import { CalculationInfo } from '@/components/settlement/calculation-info';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

/**
 * Main dashboard for the group
 * Shows expenses, balances, and settlements
 */
export function GroupDashboard() {
  const router = useRouter();
  const group = useAtomValue(groupAtom);
  const members = useAtomValue(membersAtom);

  // Redirect to home if no group exists
  useEffect(() => {
    if (!group || members.length === 0) {
      router.push('/');
    }
  }, [group, members, router]);

  if (!group) {
    return (
      <div className="container mx-auto max-w-md p-4 text-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md p-4 space-y-6">
      {/* Group Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-center">{group.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 text-sm">
            {members.length}人のメンバー: {members.map((m) => m.name).join('、')}
          </p>
        </CardContent>
      </Card>

      {/* Calculation Info */}
      <CalculationInfo />

      {/* Add Expense */}
      <AddExpenseForm />

      <Separator />

      {/* Expense List */}
      <ExpenseList />

      <Separator />

      {/* Balance Summary */}
      <BalanceSummary />

      <Separator />

      {/* Settlement List */}
      <SettlementList />
    </div>
  );
}

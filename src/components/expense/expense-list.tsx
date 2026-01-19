'use client';

import { useAtom, useAtomValue } from 'jotai';
import { expensesAtom, membersAtom } from '@/atoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Receipt } from 'lucide-react';
import { COMMON_CURRENCIES } from '@/lib/currency';

/**
 * List of all expenses
 */
export function ExpenseList() {
  const [expenses, setExpenses] = useAtom(expensesAtom);
  const members = useAtomValue(membersAtom);

  const handleDelete = (expenseId: string) => {
    setExpenses(expenses.filter((e) => e.id !== expenseId));
  };

  const getMemberName = (memberId: string) => {
    return members.find((m) => m.id === memberId)?.name ?? '不明';
  };

  const getCurrencySymbol = (code: string) => {
    return COMMON_CURRENCIES.find((c) => c.code === code)?.symbol ?? '';
  };

  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            支出一覧
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">まだ支出がありません</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          支出一覧 ({expenses.length}件)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {expenses.map((expense) => {
          const symbol = getCurrencySymbol(expense.currency);
          const payerName = getMemberName(expense.payerId);
          const splitNames = expense.splitAmong.map(getMemberName).join('、');
          const jpyAmount = Math.floor(expense.amount * expense.rateToJPY);

          return (
            <div
              key={expense.id}
              className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{expense.description}</span>
                  <span className="text-orange-500 font-bold">
                    {symbol}
                    {expense.amount.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {payerName}が支払い → {splitNames}で割り勘
                </p>
                {expense.currency !== 'JPY' && (
                  <p className="text-xs text-gray-400">
                    (¥{jpyAmount.toLocaleString()} @ {expense.rateToJPY.toFixed(2)})
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(expense.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

'use client';

import { useAtomValue } from 'jotai';
import { balancesAtom } from '@/atoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatJPY } from '@/lib/settlement';
import { Wallet } from 'lucide-react';

/**
 * Summary of each member's balance
 * Positive = receives money, Negative = pays money
 */
export function BalanceSummary() {
  const balances = useAtomValue(balancesAtom);

  if (balances.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          収支バランス
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {balances.map((balance) => (
          <div
            key={balance.memberId}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <span className="font-medium">{balance.memberName}</span>
            <span
              className={`font-bold ${
                balance.balance > 0
                  ? 'text-green-600'
                  : balance.balance < 0
                    ? 'text-red-500'
                    : 'text-gray-500'
              }`}
            >
              {balance.balance > 0 ? '+' : ''}
              {formatJPY(balance.balance)}
            </span>
          </div>
        ))}
        <p className="text-xs text-gray-400 text-center mt-2">
          プラス: 受け取る / マイナス: 支払う
        </p>
      </CardContent>
    </Card>
  );
}

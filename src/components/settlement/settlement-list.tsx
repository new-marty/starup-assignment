'use client';

import { useAtomValue } from 'jotai';
import { settlementsAtom, membersAtom } from '@/atoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatJPY } from '@/lib/settlement';
import { ArrowRight, CheckCircle } from 'lucide-react';

/**
 * List of settlements (who pays whom how much)
 */
export function SettlementList() {
  const settlements = useAtomValue(settlementsAtom);
  const members = useAtomValue(membersAtom);

  const getMemberName = (memberId: string) => {
    return members.find((m) => m.id === memberId)?.name ?? '不明';
  };

  if (settlements.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            精算
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">精算は不要です！</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
          <CheckCircle className="w-5 h-5" />
          精算方法
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {settlements.map((settlement, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700">{getMemberName(settlement.from)}</span>
              <ArrowRight className="w-4 h-4 text-orange-400" />
              <span className="font-bold text-gray-700">{getMemberName(settlement.to)}</span>
            </div>
            <span className="font-bold text-orange-600 text-lg">
              {formatJPY(settlement.amount)}
            </span>
          </div>
        ))}
        <p className="text-xs text-gray-400 text-center mt-2">送金回数を最小化した精算方法です</p>
      </CardContent>
    </Card>
  );
}

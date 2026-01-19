'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Component explaining how the settlement calculation works
 */
export function CalculationInfo() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="pb-2">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
            <Info className="w-4 h-4" />
            計算方法について
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-blue-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-blue-700" />
          )}
        </Button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="text-xs text-blue-800 space-y-3 pt-0">
          <div>
            <p className="font-semibold mb-1">💴 金額の丸め</p>
            <p>
              割り切れない場合は切り捨てます。
              <br />
              例: 1000円を3人で割ると1人333円。
              残り1円は支払った人が負担します（999円分のみ精算対象）。
            </p>
          </div>

          <div>
            <p className="font-semibold mb-1">📊 収支バランスの計算</p>
            <ul className="list-disc list-inside space-y-1">
              <li>各メンバーが「払った額」と「負担すべき額」の差を計算</li>
              <li>プラス = お金を受け取る側</li>
              <li>マイナス = お金を払う側</li>
              <li>全員の収支を合計すると必ず0円になります</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-1">💱 為替レート</p>
            <p>
              外貨の支出は、追加時のレートで日本円に換算して記録されます。
              後でレートが変わっても、追加時の金額が使われます。
            </p>
          </div>

          <div>
            <p className="font-semibold mb-1">🔄 精算方法</p>
            <p>
              送金回数を最小化するアルゴリズムを使用しています。
              最も多く受け取る人と最も多く払う人をマッチングして、効率的に精算します。
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

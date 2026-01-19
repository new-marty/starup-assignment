'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { currenciesAtom, selectedCurrenciesAtom, DEFAULT_CURRENCY } from '@/atoms';
import { COMMON_CURRENCIES } from '@/lib/currency';
import type { Currency } from '@/types';
import { Globe, Loader2 } from 'lucide-react';

/**
 * Component for selecting currencies and fetching exchange rates
 * Used for international trips with multiple currencies
 */
export function CurrencySelector() {
  const [currencies, setCurrencies] = useAtom(currenciesAtom);
  const [selectedCodes, setSelectedCodes] = useAtom(selectedCurrenciesAtom);
  const [isLoading, setIsLoading] = useState(false);

  // Available currencies (excluding already selected ones)
  const availableCurrencies = COMMON_CURRENCIES.filter(
    (c) => c.code !== 'JPY' && !selectedCodes.includes(c.code)
  );

  const toggleCurrency = (code: string) => {
    if (selectedCodes.includes(code)) {
      setSelectedCodes(selectedCodes.filter((c) => c !== code));
    } else {
      setSelectedCodes([...selectedCodes, code]);
    }
  };

  const fetchRates = async () => {
    const foreignCurrencies = selectedCodes.filter((c) => c !== 'JPY');
    if (foreignCurrencies.length === 0) {
      // Reset to JPY only
      setCurrencies([DEFAULT_CURRENCY]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/exchange-rates?currencies=${foreignCurrencies.join(',')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch rates');
      }
      const data = await response.json();
      setCurrencies(data.currencies as Currency[]);
      toast.success('為替レートを取得しました');
    } catch {
      toast.error('為替レートの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if rates need to be fetched
  const needsFetch =
    selectedCodes.filter((c) => c !== 'JPY').length > 0 &&
    currencies.length !== selectedCodes.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="w-5 h-5" />
          通貨設定
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-500">海外旅行の場合は使用する通貨を選択してください</p>

        {/* Currency selection */}
        <div className="flex flex-wrap gap-2">
          {/* JPY is always selected */}
          <Button variant="default" size="sm" disabled className="bg-gray-400">
            JPY (日本円)
          </Button>

          {/* Selected foreign currencies */}
          {selectedCodes
            .filter((c) => c !== 'JPY')
            .map((code) => {
              const info = COMMON_CURRENCIES.find((c) => c.code === code);
              return (
                <Button
                  key={code}
                  variant="default"
                  size="sm"
                  onClick={() => toggleCurrency(code)}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {code} ({info?.name})
                </Button>
              );
            })}

          {/* Available currencies */}
          {availableCurrencies.map((c) => (
            <Button key={c.code} variant="outline" size="sm" onClick={() => toggleCurrency(c.code)}>
              {c.code}
            </Button>
          ))}
        </div>

        {/* Fetch rates button */}
        {needsFetch && (
          <Button onClick={fetchRates} disabled={isLoading} className="w-full" variant="outline">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                取得中...
              </>
            ) : (
              '為替レートを取得'
            )}
          </Button>
        )}

        {/* Current rates display */}
        {currencies.length > 1 && (
          <div className="text-xs text-gray-500 space-y-1">
            <p className="font-medium">現在のレート:</p>
            {currencies
              .filter((c) => c.code !== 'JPY')
              .map((c) => (
                <p key={c.code}>
                  1 {c.code} = ¥{Math.round(c.rateToJPY).toLocaleString()}
                </p>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { membersAtom, expensesAtom } from '@/atoms';
import { generateId, COMMON_CURRENCIES } from '@/lib/currency';
import type { Expense } from '@/types';
import { Plus, Loader2 } from 'lucide-react';

/**
 * Form for adding a new expense
 * Fetches exchange rates on-demand when a foreign currency is selected
 */
export function AddExpenseForm() {
  const members = useAtomValue(membersAtom);
  const [expenses, setExpenses] = useAtom(expensesAtom);

  const [payerId, setPayerId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('JPY');
  const [description, setDescription] = useState('');
  const [splitAmong, setSplitAmong] = useState<string[]>([]);

  // Exchange rate state
  const [currentRate, setCurrentRate] = useState(1);
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  // Fetch exchange rate when currency changes
  const fetchRate = useCallback(async (currencyCode: string) => {
    if (currencyCode === 'JPY') {
      setCurrentRate(1);
      return;
    }

    setIsLoadingRate(true);
    try {
      const response = await fetch(`/api/exchange-rates?currencies=${currencyCode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch rate');
      }
      const data = await response.json();
      const currencyData = data.currencies?.find(
        (c: { code: string; rateToJPY: number }) => c.code === currencyCode
      );
      if (currencyData) {
        setCurrentRate(currencyData.rateToJPY);
      }
    } catch {
      toast.error('為替レートの取得に失敗しました');
      // Fallback to 1 if fetch fails
      setCurrentRate(1);
    } finally {
      setIsLoadingRate(false);
    }
  }, []);

  useEffect(() => {
    fetchRate(currency);
  }, [currency, fetchRate]);

  const handleSelectAllMembers = () => {
    setSplitAmong(members.map((m) => m.id));
  };

  const toggleMemberInSplit = (memberId: string) => {
    if (splitAmong.includes(memberId)) {
      setSplitAmong(splitAmong.filter((id) => id !== memberId));
    } else {
      setSplitAmong([...splitAmong, memberId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!payerId) {
      toast.error('支払者を選択してください');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('金額を正しく入力してください');
      return;
    }
    if (!description.trim()) {
      toast.error('何に使ったか入力してください');
      return;
    }
    if (splitAmong.length === 0) {
      toast.error('割り勘対象を選択してください');
      return;
    }

    // Create expense with the current rate fixed
    const newExpense: Expense = {
      id: generateId(),
      payerId,
      amount: Number(amount),
      currency,
      rateToJPY: currentRate,
      description: description.trim(),
      splitAmong,
      createdAt: new Date(),
    };

    setExpenses([...expenses, newExpense]);

    // Reset form
    setPayerId('');
    setAmount('');
    setDescription('');
    setSplitAmong([]);

    toast.success('支出を追加しました');
  };

  // Calculate JPY equivalent for display
  const jpyEquivalent = amount ? Math.floor(Number(amount) * currentRate) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="w-5 h-5" />
          支出を追加
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payer */}
          <div className="space-y-2">
            <Label>支払者</Label>
            <Select value={payerId} onValueChange={setPayerId}>
              <SelectTrigger>
                <SelectValue placeholder="誰が払った？" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount and Currency */}
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label>金額</Label>
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="w-24 space-y-2">
              <Label>通貨</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Exchange rate info */}
          {currency !== 'JPY' && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              {isLoadingRate ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  レート取得中...
                </span>
              ) : (
                <>
                  <p>
                    レート: 1 {currency} = ¥{currentRate.toFixed(2)}
                  </p>
                  {amount && jpyEquivalent > 0 && (
                    <p className="font-medium">
                      ≈ ¥{jpyEquivalent.toLocaleString()} (この金額で計算)
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label>何に使った？</Label>
            <Input
              placeholder="例: レンタカー代"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Split Among */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>割り勘対象</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAllMembers}
                className="text-orange-500 text-xs"
              >
                全員選択
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <Button
                  key={member.id}
                  type="button"
                  variant={splitAmong.includes(member.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleMemberInSplit(member.id)}
                  className={
                    splitAmong.includes(member.id)
                      ? 'bg-orange-400 hover:bg-orange-500'
                      : 'hover:bg-orange-50'
                  }
                >
                  {member.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-orange-400 hover:bg-orange-500"
            disabled={isLoadingRate}
          >
            追加する
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

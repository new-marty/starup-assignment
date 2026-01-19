'use client';

import { useState } from 'react';
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
import { membersAtom, expensesAtom, currenciesAtom } from '@/atoms';
import { generateId } from '@/lib/currency';
import type { Expense } from '@/types';
import { Plus } from 'lucide-react';

/**
 * Form for adding a new expense
 */
export function AddExpenseForm() {
  const members = useAtomValue(membersAtom);
  const currencies = useAtomValue(currenciesAtom);
  const [expenses, setExpenses] = useAtom(expensesAtom);

  const [payerId, setPayerId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('JPY');
  const [description, setDescription] = useState('');
  const [splitAmong, setSplitAmong] = useState<string[]>([]);

  // Initialize split among all members
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

    // Create expense
    const newExpense: Expense = {
      id: generateId(),
      payerId,
      amount: Number(amount),
      currency,
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
                step="1"
              />
            </div>
            <div className="w-24 space-y-2">
              <Label>通貨</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
          <Button type="submit" className="w-full bg-orange-400 hover:bg-orange-500">
            追加する
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

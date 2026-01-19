import { describe, it, expect } from 'vitest';
import { calculateBalances, calculateSettlements, formatJPY } from '@/lib/settlement';
import type { Member, Expense, Currency } from '@/types';

// Currencies for testing
const JPY: Currency = { code: 'JPY', symbol: '¥', name: '日本円', rateToJPY: 1 };
const USD: Currency = { code: 'USD', symbol: '$', name: '米ドル', rateToJPY: 150 };
const EUR: Currency = { code: 'EUR', symbol: '€', name: 'ユーロ', rateToJPY: 160 };

describe('calculateBalances', () => {
  it('should return empty array when no members', () => {
    const result = calculateBalances([], [], [JPY]);
    expect(result).toEqual([]);
  });

  it('should return zero balances when no expenses', () => {
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ];
    const result = calculateBalances(members, [], [JPY]);
    expect(result).toEqual([
      { memberId: '1', memberName: 'A', balance: 0 },
      { memberId: '2', memberName: 'B', balance: 0 },
    ]);
  });

  it('should calculate correct balances for simple 2-person split', () => {
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        payerId: '1',
        amount: 1000,
        currency: 'JPY',
        description: 'Dinner',
        splitAmong: ['1', '2'],
        createdAt: new Date(),
      },
    ];
    const result = calculateBalances(members, expenses, [JPY]);

    // A paid 1000, owes 500 → balance = +500
    // B paid 0, owes 500 → balance = -500
    expect(result).toEqual([
      { memberId: '1', memberName: 'A', balance: 500 },
      { memberId: '2', memberName: 'B', balance: -500 },
    ]);
  });

  it('should calculate correct balances for 3-person split', () => {
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
      { id: '3', name: 'C' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        payerId: '1',
        amount: 3000,
        currency: 'JPY',
        description: 'Hotel',
        splitAmong: ['1', '2', '3'],
        createdAt: new Date(),
      },
    ];
    const result = calculateBalances(members, expenses, [JPY]);

    // A paid 3000, owes 1000 → balance = +2000
    // B paid 0, owes 1000 → balance = -1000
    // C paid 0, owes 1000 → balance = -1000
    expect(result).toEqual([
      { memberId: '1', memberName: 'A', balance: 2000 },
      { memberId: '2', memberName: 'B', balance: -1000 },
      { memberId: '3', memberName: 'C', balance: -1000 },
    ]);
  });

  it('should handle multiple payers correctly', () => {
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
      { id: '3', name: 'C' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        payerId: '1',
        amount: 2100,
        currency: 'JPY',
        description: 'Dinner',
        splitAmong: ['1', '2', '3'],
        createdAt: new Date(),
      },
      {
        id: 'e2',
        payerId: '2',
        amount: 900,
        currency: 'JPY',
        description: 'Drinks',
        splitAmong: ['1', '2', '3'],
        createdAt: new Date(),
      },
    ];
    const result = calculateBalances(members, expenses, [JPY]);

    // Per person: 2100/3=700 + 900/3=300 = 1000
    // A paid 2100, owes 1000 → balance = +1100
    // B paid 900, owes 1000 → balance = -100
    // C paid 0, owes 1000 → balance = -1000
    expect(result).toEqual([
      { memberId: '1', memberName: 'A', balance: 1100 },
      { memberId: '2', memberName: 'B', balance: -100 },
      { memberId: '3', memberName: 'C', balance: -1000 },
    ]);
  });

  it('should handle non-equal splits (floor division)', () => {
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        payerId: '1',
        amount: 1001,
        currency: 'JPY',
        description: 'Odd amount',
        splitAmong: ['1', '2'],
        createdAt: new Date(),
      },
    ];
    const result = calculateBalances(members, expenses, [JPY]);

    // 1001 / 2 = 500 (floor)
    // A paid 1001, owes 500 → balance = +501
    // B paid 0, owes 500 → balance = -500
    expect(result[0]?.balance).toBe(501);
    expect(result[1]?.balance).toBe(-500);
  });

  it('should convert USD expense to JPY', () => {
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        payerId: '1',
        amount: 100, // $100
        currency: 'USD',
        description: 'Dinner in USA',
        splitAmong: ['1', '2'],
        createdAt: new Date(),
      },
    ];
    const result = calculateBalances(members, expenses, [JPY, USD]);

    // $100 * 150 = ¥15,000
    // Per person: ¥7,500
    // A paid ¥15,000, owes ¥7,500 → balance = +7,500
    // B paid ¥0, owes ¥7,500 → balance = -7,500
    expect(result).toEqual([
      { memberId: '1', memberName: 'A', balance: 7500 },
      { memberId: '2', memberName: 'B', balance: -7500 },
    ]);
  });

  it('should handle mixed currency expenses', () => {
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        payerId: '1',
        amount: 3000, // ¥3,000
        currency: 'JPY',
        description: 'Japanese meal',
        splitAmong: ['1', '2'],
        createdAt: new Date(),
      },
      {
        id: 'e2',
        payerId: '2',
        amount: 50, // $50 = ¥7,500
        currency: 'USD',
        description: 'American meal',
        splitAmong: ['1', '2'],
        createdAt: new Date(),
      },
    ];
    const result = calculateBalances(members, expenses, [JPY, USD]);

    // Total in JPY: ¥3,000 + ¥7,500 = ¥10,500
    // Per person: ¥1,500 + ¥3,750 = ¥5,250
    // A paid ¥3,000, owes ¥5,250 → balance = -2,250
    // B paid ¥7,500, owes ¥5,250 → balance = +2,250
    expect(result).toEqual([
      { memberId: '1', memberName: 'A', balance: -2250 },
      { memberId: '2', memberName: 'B', balance: 2250 },
    ]);
  });

  it('should handle EUR currency conversion', () => {
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
      { id: '3', name: 'C' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        payerId: '1',
        amount: 100, // €100 = ¥16,000
        currency: 'EUR',
        description: 'European dinner',
        splitAmong: ['1', '2', '3'],
        createdAt: new Date(),
      },
    ];
    const result = calculateBalances(members, expenses, [JPY, USD, EUR]);

    // €100 * 160 = ¥16,000
    // Per person: floor(¥16,000 / 3) = ¥5,333
    // A paid ¥16,000, owes ¥5,333 → balance = +10,667
    // B paid ¥0, owes ¥5,333 → balance = -5,333
    // C paid ¥0, owes ¥5,333 → balance = -5,333
    expect(result).toEqual([
      { memberId: '1', memberName: 'A', balance: 10667 },
      { memberId: '2', memberName: 'B', balance: -5333 },
      { memberId: '3', memberName: 'C', balance: -5333 },
    ]);
  });

  it('should use rate of 1 for unknown currency', () => {
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        payerId: '1',
        amount: 1000,
        currency: 'XYZ', // Unknown currency
        description: 'Unknown currency expense',
        splitAmong: ['1', '2'],
        createdAt: new Date(),
      },
    ];
    const result = calculateBalances(members, expenses, [JPY]);

    // Unknown currency defaults to rate 1
    // 1000 / 2 = 500
    expect(result).toEqual([
      { memberId: '1', memberName: 'A', balance: 500 },
      { memberId: '2', memberName: 'B', balance: -500 },
    ]);
  });
});

describe('calculateSettlements', () => {
  it('should return empty array when all balances are zero', () => {
    const balances = [
      { memberId: '1', memberName: 'A', balance: 0 },
      { memberId: '2', memberName: 'B', balance: 0 },
    ];
    const result = calculateSettlements(balances);
    expect(result).toEqual([]);
  });

  it('should calculate simple 2-person settlement', () => {
    const balances = [
      { memberId: '1', memberName: 'A', balance: 500 },
      { memberId: '2', memberName: 'B', balance: -500 },
    ];
    const result = calculateSettlements(balances);
    expect(result).toEqual([{ from: '2', to: '1', amount: 500 }]);
  });

  it('should calculate 3-person settlement with one payer', () => {
    const balances = [
      { memberId: '1', memberName: 'A', balance: 2000 },
      { memberId: '2', memberName: 'B', balance: -1000 },
      { memberId: '3', memberName: 'C', balance: -1000 },
    ];
    const result = calculateSettlements(balances);

    // Should produce 2 settlements: B→A: 1000, C→A: 1000
    expect(result.length).toBe(2);
    expect(result).toContainEqual({ from: '2', to: '1', amount: 1000 });
    expect(result).toContainEqual({ from: '3', to: '1', amount: 1000 });
  });

  it('should minimize transactions with multiple creditors and debtors', () => {
    const balances = [
      { memberId: '1', memberName: 'A', balance: 1100 },
      { memberId: '2', memberName: 'B', balance: -100 },
      { memberId: '3', memberName: 'C', balance: -1000 },
    ];
    const result = calculateSettlements(balances);

    // Greedy: C→A: 1000, B→A: 100
    expect(result.length).toBe(2);
    expect(result).toContainEqual({ from: '3', to: '1', amount: 1000 });
    expect(result).toContainEqual({ from: '2', to: '1', amount: 100 });
  });

  it('should handle complex multi-person scenario', () => {
    // A paid a lot, B and C owe different amounts
    const balances = [
      { memberId: '1', memberName: 'A', balance: 5000 },
      { memberId: '2', memberName: 'B', balance: -2000 },
      { memberId: '3', memberName: 'C', balance: -3000 },
    ];
    const result = calculateSettlements(balances);

    // Total settlements should equal 5000
    const totalSettled = result.reduce((sum, s) => sum + s.amount, 0);
    expect(totalSettled).toBe(5000);
  });
});

describe('formatJPY', () => {
  it('should format positive amounts with yen symbol', () => {
    // Intl.NumberFormat uses full-width yen symbol (￥)
    expect(formatJPY(1000)).toBe('￥1,000');
    expect(formatJPY(1234567)).toBe('￥1,234,567');
  });

  it('should format zero', () => {
    expect(formatJPY(0)).toBe('￥0');
  });

  it('should format negative amounts', () => {
    expect(formatJPY(-500)).toBe('-￥500');
  });
});

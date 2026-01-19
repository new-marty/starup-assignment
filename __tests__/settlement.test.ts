import { describe, it, expect } from 'vitest';
import { calculateBalances, calculateSettlements, formatJPY } from '@/lib/settlement';
import type { Member, Expense } from '@/types';

// Helper to create expense with required fields
function createExpense(
  overrides: Partial<Expense> & {
    payerId: string;
    amount: number;
    currency: string;
    rateToJPY: number;
    splitAmong: string[];
  }
): Expense {
  return {
    id: overrides.id ?? `e${Math.random()}`,
    description: overrides.description ?? 'Test expense',
    createdAt: overrides.createdAt ?? new Date(),
    ...overrides,
  };
}

describe('calculateBalances', () => {
  it('should return empty array when no members', () => {
    const result = calculateBalances([], []);
    expect(result).toEqual([]);
  });

  it('should return zero balances when no expenses', () => {
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ];
    const result = calculateBalances(members, []);
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
      createExpense({
        id: 'e1',
        payerId: '1',
        amount: 1000,
        currency: 'JPY',
        rateToJPY: 1,
        description: 'Dinner',
        splitAmong: ['1', '2'],
      }),
    ];
    const result = calculateBalances(members, expenses);

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
      createExpense({
        id: 'e1',
        payerId: '1',
        amount: 3000,
        currency: 'JPY',
        rateToJPY: 1,
        description: 'Hotel',
        splitAmong: ['1', '2', '3'],
      }),
    ];
    const result = calculateBalances(members, expenses);

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
      createExpense({
        id: 'e1',
        payerId: '1',
        amount: 2100,
        currency: 'JPY',
        rateToJPY: 1,
        description: 'Dinner',
        splitAmong: ['1', '2', '3'],
      }),
      createExpense({
        id: 'e2',
        payerId: '2',
        amount: 900,
        currency: 'JPY',
        rateToJPY: 1,
        description: 'Drinks',
        splitAmong: ['1', '2', '3'],
      }),
    ];
    const result = calculateBalances(members, expenses);

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
      createExpense({
        id: 'e1',
        payerId: '1',
        amount: 1001,
        currency: 'JPY',
        rateToJPY: 1,
        description: 'Odd amount',
        splitAmong: ['1', '2'],
      }),
    ];
    const result = calculateBalances(members, expenses);

    // 1001 / 2 = 500 (floor)
    // Collectible amount: 500 * 2 = 1000
    // A paid 1001 but only credits 1000 (collectible), owes 500 → balance = +500
    // B paid 0, owes 500 → balance = -500
    // Total balances sum to zero (500 - 500 = 0)
    expect(result[0]?.balance).toBe(500);
    expect(result[1]?.balance).toBe(-500);
  });

  it('should convert USD expense to JPY', () => {
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ];
    const expenses: Expense[] = [
      createExpense({
        id: 'e1',
        payerId: '1',
        amount: 100, // $100
        currency: 'USD',
        rateToJPY: 150, // Fixed rate at expense creation
        description: 'Dinner in USA',
        splitAmong: ['1', '2'],
      }),
    ];
    const result = calculateBalances(members, expenses);

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
      createExpense({
        id: 'e1',
        payerId: '1',
        amount: 3000, // ¥3,000
        currency: 'JPY',
        rateToJPY: 1,
        description: 'Japanese meal',
        splitAmong: ['1', '2'],
      }),
      createExpense({
        id: 'e2',
        payerId: '2',
        amount: 50, // $50 = ¥7,500
        currency: 'USD',
        rateToJPY: 150,
        description: 'American meal',
        splitAmong: ['1', '2'],
      }),
    ];
    const result = calculateBalances(members, expenses);

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
      createExpense({
        id: 'e1',
        payerId: '1',
        amount: 100, // €100 = ¥16,000
        currency: 'EUR',
        rateToJPY: 160,
        description: 'European dinner',
        splitAmong: ['1', '2', '3'],
      }),
    ];
    const result = calculateBalances(members, expenses);

    // €100 * 160 = ¥16,000
    // Per person: floor(¥16,000 / 3) = ¥5,333
    // Collectible: 5333 * 3 = ¥15,999
    // A paid but only credits ¥15,999, owes ¥5,333 → balance = +10,666
    // B paid ¥0, owes ¥5,333 → balance = -5,333
    // C paid ¥0, owes ¥5,333 → balance = -5,333
    // Total: 10666 - 5333 - 5333 = 0 ✓
    expect(result).toEqual([
      { memberId: '1', memberName: 'A', balance: 10666 },
      { memberId: '2', memberName: 'B', balance: -5333 },
      { memberId: '3', memberName: 'C', balance: -5333 },
    ]);
  });

  it('should use the rate stored in expense (not from currencies array)', () => {
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ];
    // Expense has rate 100, but currencies array has rate 150
    // The expense rate should be used
    const expenses: Expense[] = [
      createExpense({
        id: 'e1',
        payerId: '1',
        amount: 100,
        currency: 'USD',
        rateToJPY: 100, // Rate at expense creation time
        description: 'Test',
        splitAmong: ['1', '2'],
      }),
    ];
    const result = calculateBalances(members, expenses); // USD in array has rate 150

    // Should use expense.rateToJPY = 100, not currencies array rate 150
    // $100 * 100 = ¥10,000
    // Per person: ¥5,000
    expect(result).toEqual([
      { memberId: '1', memberName: 'A', balance: 5000 },
      { memberId: '2', memberName: 'B', balance: -5000 },
    ]);
  });

  describe('rounding edge cases', () => {
    it('should handle 1000 yen split 3 ways - balances must sum to zero', () => {
      const members: Member[] = [
        { id: '1', name: 'a' },
        { id: '2', name: 'b' },
        { id: '3', name: 'c' },
      ];
      const expenses: Expense[] = [
        createExpense({
          id: 'e1',
          payerId: '1',
          amount: 1000,
          currency: 'JPY',
          rateToJPY: 1,
          description: 'Dinner',
          splitAmong: ['1', '2', '3'],
        }),
      ];
      const result = calculateBalances(members, expenses);

      // 1000 / 3 = 333 (floor)
      // Collectible: 333 * 3 = 999
      // a: credits 999, owes 333 → balance = +666
      // b: credits 0, owes 333 → balance = -333
      // c: credits 0, owes 333 → balance = -333
      expect(result).toEqual([
        { memberId: '1', memberName: 'a', balance: 666 },
        { memberId: '2', memberName: 'b', balance: -333 },
        { memberId: '3', memberName: 'c', balance: -333 },
      ]);

      // Verify balances sum to zero
      const totalBalance = result.reduce((sum, b) => sum + b.balance, 0);
      expect(totalBalance).toBe(0);
    });

    it('should handle 100 yen split 3 ways', () => {
      const members: Member[] = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
        { id: '3', name: 'C' },
      ];
      const expenses: Expense[] = [
        createExpense({
          id: 'e1',
          payerId: '1',
          amount: 100,
          currency: 'JPY',
          rateToJPY: 1,
          description: 'Snack',
          splitAmong: ['1', '2', '3'],
        }),
      ];
      const result = calculateBalances(members, expenses);

      // 100 / 3 = 33 (floor)
      // Collectible: 33 * 3 = 99
      // A: credits 99, owes 33 → balance = +66
      // B: credits 0, owes 33 → balance = -33
      // C: credits 0, owes 33 → balance = -33
      expect(result).toEqual([
        { memberId: '1', memberName: 'A', balance: 66 },
        { memberId: '2', memberName: 'B', balance: -33 },
        { memberId: '3', memberName: 'C', balance: -33 },
      ]);

      const totalBalance = result.reduce((sum, b) => sum + b.balance, 0);
      expect(totalBalance).toBe(0);
    });

    it('should handle amount divisible by participant count (no remainder)', () => {
      const members: Member[] = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
        { id: '3', name: 'C' },
      ];
      const expenses: Expense[] = [
        createExpense({
          id: 'e1',
          payerId: '1',
          amount: 900,
          currency: 'JPY',
          rateToJPY: 1,
          description: 'Clean split',
          splitAmong: ['1', '2', '3'],
        }),
      ];
      const result = calculateBalances(members, expenses);

      // 900 / 3 = 300 (exact)
      // A: credits 900, owes 300 → balance = +600
      // B: credits 0, owes 300 → balance = -300
      // C: credits 0, owes 300 → balance = -300
      expect(result).toEqual([
        { memberId: '1', memberName: 'A', balance: 600 },
        { memberId: '2', memberName: 'B', balance: -300 },
        { memberId: '3', memberName: 'C', balance: -300 },
      ]);

      const totalBalance = result.reduce((sum, b) => sum + b.balance, 0);
      expect(totalBalance).toBe(0);
    });

    it('should handle 1 yen split 3 ways (extreme case)', () => {
      const members: Member[] = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
        { id: '3', name: 'C' },
      ];
      const expenses: Expense[] = [
        createExpense({
          id: 'e1',
          payerId: '1',
          amount: 1,
          currency: 'JPY',
          rateToJPY: 1,
          description: 'Tiny',
          splitAmong: ['1', '2', '3'],
        }),
      ];
      const result = calculateBalances(members, expenses);

      // 1 / 3 = 0 (floor)
      // Collectible: 0 * 3 = 0
      // All balances should be 0
      expect(result).toEqual([
        { memberId: '1', memberName: 'A', balance: 0 },
        { memberId: '2', memberName: 'B', balance: 0 },
        { memberId: '3', memberName: 'C', balance: 0 },
      ]);

      const totalBalance = result.reduce((sum, b) => sum + b.balance, 0);
      expect(totalBalance).toBe(0);
    });

    it('should handle 2 yen split 3 ways', () => {
      const members: Member[] = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
        { id: '3', name: 'C' },
      ];
      const expenses: Expense[] = [
        createExpense({
          id: 'e1',
          payerId: '1',
          amount: 2,
          currency: 'JPY',
          rateToJPY: 1,
          description: 'Very small',
          splitAmong: ['1', '2', '3'],
        }),
      ];
      const result = calculateBalances(members, expenses);

      // 2 / 3 = 0 (floor)
      // All balances should be 0
      expect(result).toEqual([
        { memberId: '1', memberName: 'A', balance: 0 },
        { memberId: '2', memberName: 'B', balance: 0 },
        { memberId: '3', memberName: 'C', balance: 0 },
      ]);
    });

    it('should handle multiple expenses with rounding - balances must sum to zero', () => {
      const members: Member[] = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
        { id: '3', name: 'C' },
      ];
      const expenses: Expense[] = [
        createExpense({
          id: 'e1',
          payerId: '1',
          amount: 1000,
          currency: 'JPY',
          rateToJPY: 1,
          description: 'Expense 1',
          splitAmong: ['1', '2', '3'],
        }),
        createExpense({
          id: 'e2',
          payerId: '2',
          amount: 500,
          currency: 'JPY',
          rateToJPY: 1,
          description: 'Expense 2',
          splitAmong: ['1', '2', '3'],
        }),
      ];
      const result = calculateBalances(members, expenses);

      // Expense 1: 1000 / 3 = 333, collectible = 999
      // Expense 2: 500 / 3 = 166, collectible = 498
      // A: credits 999, owes 333+166=499 → balance = +500
      // B: credits 498, owes 333+166=499 → balance = -1
      // C: credits 0, owes 333+166=499 → balance = -499
      expect(result).toEqual([
        { memberId: '1', memberName: 'A', balance: 500 },
        { memberId: '2', memberName: 'B', balance: -1 },
        { memberId: '3', memberName: 'C', balance: -499 },
      ]);

      const totalBalance = result.reduce((sum, b) => sum + b.balance, 0);
      expect(totalBalance).toBe(0);
    });

    it('should always produce balances that sum to zero for any expense', () => {
      const members: Member[] = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
        { id: '3', name: 'C' },
        { id: '4', name: 'D' },
      ];

      // Test various amounts that would cause rounding
      const testAmounts = [1, 2, 3, 7, 11, 13, 17, 19, 23, 100, 1000, 9999];

      for (const amount of testAmounts) {
        const expenses: Expense[] = [
          createExpense({
            id: 'e1',
            payerId: '1',
            amount,
            currency: 'JPY',
            rateToJPY: 1,
            description: `Test ${amount}`,
            splitAmong: ['1', '2', '3', '4'],
          }),
        ];
        const result = calculateBalances(members, expenses);
        const totalBalance = result.reduce((sum, b) => sum + b.balance, 0);
        expect(totalBalance).toBe(0);
      }
    });
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

describe('decimal exchange rates', () => {
  it('should handle USD with decimal rate split 2 ways', () => {
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ];
    const expenses: Expense[] = [
      createExpense({
        id: 'e1',
        payerId: '1',
        amount: 100, // $100
        currency: 'USD',
        rateToJPY: 149.52, // Decimal rate
        description: 'Dinner in USA',
        splitAmong: ['1', '2'],
      }),
    ];
    const result = calculateBalances(members, expenses);

    // $100 * 149.52 = ¥14,952
    // Per person: floor(14952 / 2) = 7476
    // Collectible: 7476 * 2 = 14952 (no remainder)
    // A: credits 14952, owes 7476 → balance = +7476
    // B: credits 0, owes 7476 → balance = -7476
    expect(result).toEqual([
      { memberId: '1', memberName: 'A', balance: 7476 },
      { memberId: '2', memberName: 'B', balance: -7476 },
    ]);

    const totalBalance = result.reduce((sum, b) => sum + b.balance, 0);
    expect(totalBalance).toBe(0);
  });

  it('should handle USD with decimal rate split 3 ways', () => {
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
      { id: '3', name: 'C' },
    ];
    const expenses: Expense[] = [
      createExpense({
        id: 'e1',
        payerId: '1',
        amount: 100, // $100
        currency: 'USD',
        rateToJPY: 149.52,
        description: 'Dinner in USA',
        splitAmong: ['1', '2', '3'],
      }),
    ];
    const result = calculateBalances(members, expenses);

    // $100 * 149.52 = ¥14,952
    // Per person: floor(14952 / 3) = 4984
    // Collectible: 4984 * 3 = 14952 (no remainder)
    // A: credits 14952, owes 4984 → balance = +9968
    // B: credits 0, owes 4984 → balance = -4984
    // C: credits 0, owes 4984 → balance = -4984
    expect(result).toEqual([
      { memberId: '1', memberName: 'A', balance: 9968 },
      { memberId: '2', memberName: 'B', balance: -4984 },
      { memberId: '3', memberName: 'C', balance: -4984 },
    ]);

    const totalBalance = result.reduce((sum, b) => sum + b.balance, 0);
    expect(totalBalance).toBe(0);
  });

  it('should handle EUR with decimal rate causing rounding', () => {
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
      { id: '3', name: 'C' },
    ];
    const expenses: Expense[] = [
      createExpense({
        id: 'e1',
        payerId: '1',
        amount: 50, // €50
        currency: 'EUR',
        rateToJPY: 162.38,
        description: 'Dinner in Europe',
        splitAmong: ['1', '2', '3'],
      }),
    ];
    const result = calculateBalances(members, expenses);

    // €50 * 162.38 = ¥8,119
    // Per person: floor(8119 / 3) = 2706
    // Collectible: 2706 * 3 = 8118 (1 yen lost to rounding)
    // A: credits 8118, owes 2706 → balance = +5412
    // B: credits 0, owes 2706 → balance = -2706
    // C: credits 0, owes 2706 → balance = -2706
    expect(result).toEqual([
      { memberId: '1', memberName: 'A', balance: 5412 },
      { memberId: '2', memberName: 'B', balance: -2706 },
      { memberId: '3', memberName: 'C', balance: -2706 },
    ]);

    const totalBalance = result.reduce((sum, b) => sum + b.balance, 0);
    expect(totalBalance).toBe(0);
  });

  it('should handle KRW with very small decimal rate', () => {
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ];
    const expenses: Expense[] = [
      createExpense({
        id: 'e1',
        payerId: '1',
        amount: 50000, // ₩50,000
        currency: 'KRW',
        rateToJPY: 0.1089,
        description: 'Dinner in Korea',
        splitAmong: ['1', '2'],
      }),
    ];
    const result = calculateBalances(members, expenses);

    // ₩50,000 * 0.1089 = ¥5,445
    // Per person: floor(5445 / 2) = 2722
    // Collectible: 2722 * 2 = 5444 (1 yen lost to rounding)
    // A: credits 5444, owes 2722 → balance = +2722
    // B: credits 0, owes 2722 → balance = -2722
    expect(result).toEqual([
      { memberId: '1', memberName: 'A', balance: 2722 },
      { memberId: '2', memberName: 'B', balance: -2722 },
    ]);

    const totalBalance = result.reduce((sum, b) => sum + b.balance, 0);
    expect(totalBalance).toBe(0);
  });

  it('should handle small amounts with decimal rates that result in tiny JPY values', () => {
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
      { id: '3', name: 'C' },
    ];
    const expenses: Expense[] = [
      createExpense({
        id: 'e1',
        payerId: '1',
        amount: 1, // $1
        currency: 'USD',
        rateToJPY: 149.52,
        description: 'Small purchase',
        splitAmong: ['1', '2', '3'],
      }),
    ];
    const result = calculateBalances(members, expenses);

    // $1 * 149.52 = ¥149.52
    // Per person: floor(149.52 / 3) = 49
    // Collectible: 49 * 3 = 147
    // A: credits 147, owes 49 → balance = +98
    // B: credits 0, owes 49 → balance = -49
    // C: credits 0, owes 49 → balance = -49
    expect(result).toEqual([
      { memberId: '1', memberName: 'A', balance: 98 },
      { memberId: '2', memberName: 'B', balance: -49 },
      { memberId: '3', memberName: 'C', balance: -49 },
    ]);

    const totalBalance = result.reduce((sum, b) => sum + b.balance, 0);
    expect(totalBalance).toBe(0);
  });

  it('should handle mixed currencies with decimal rates', () => {
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
      { id: '3', name: 'C' },
    ];
    const expenses: Expense[] = [
      createExpense({
        id: 'e1',
        payerId: '1',
        amount: 100, // $100 = ¥14,952
        currency: 'USD',
        rateToJPY: 149.52,
        description: 'US expense',
        splitAmong: ['1', '2', '3'],
      }),
      createExpense({
        id: 'e2',
        payerId: '2',
        amount: 50, // €50 = ¥8,119
        currency: 'EUR',
        rateToJPY: 162.38,
        description: 'EU expense',
        splitAmong: ['1', '2', '3'],
      }),
    ];
    const result = calculateBalances(members, expenses);

    // Expense 1: $100 * 149.52 = ¥14,952
    //   Per person: floor(14952 / 3) = 4984
    //   Collectible: 4984 * 3 = 14952
    // Expense 2: €50 * 162.38 = ¥8,119
    //   Per person: floor(8119 / 3) = 2706
    //   Collectible: 2706 * 3 = 8118
    //
    // A: credits 14952, owes 4984+2706=7690 → balance = +7262
    // B: credits 8118, owes 4984+2706=7690 → balance = +428
    // C: credits 0, owes 4984+2706=7690 → balance = -7690
    expect(result).toEqual([
      { memberId: '1', memberName: 'A', balance: 7262 },
      { memberId: '2', memberName: 'B', balance: 428 },
      { memberId: '3', memberName: 'C', balance: -7690 },
    ]);

    const totalBalance = result.reduce((sum, b) => sum + b.balance, 0);
    expect(totalBalance).toBe(0);
  });

  it('should always produce balances that sum to zero with various decimal rates', () => {
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
      { id: '3', name: 'C' },
    ];

    // Test various realistic decimal exchange rates
    const testRates = [
      { code: 'USD', rate: 149.52 },
      { code: 'USD', rate: 150.0 },
      { code: 'USD', rate: 148.77 },
      { code: 'EUR', rate: 162.38 },
      { code: 'EUR', rate: 160.0 },
      { code: 'GBP', rate: 188.45 },
      { code: 'KRW', rate: 0.1089 },
      { code: 'THB', rate: 4.23 },
    ];

    const testAmounts = [1, 7, 10, 33, 50, 100, 999, 1234];

    for (const { code, rate } of testRates) {
      for (const amount of testAmounts) {
        const expenses: Expense[] = [
          createExpense({
            id: 'e1',
            payerId: '1',
            amount,
            currency: code,
            rateToJPY: rate,
            description: `Test ${code} ${amount}`,
            splitAmong: ['1', '2', '3'],
          }),
        ];
        const result = calculateBalances(members, expenses);
        const totalBalance = result.reduce((sum, b) => sum + b.balance, 0);
        expect(totalBalance).toBe(0);
      }
    }
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

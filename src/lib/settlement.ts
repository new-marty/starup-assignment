import type { Member, Expense, MemberBalance, Settlement } from '@/types';

/**
 * Calculate the balance for each member based on expenses
 * Positive balance = creditor (paid more than their share, should receive money)
 * Negative balance = debtor (paid less than their share, should pay money)
 *
 * Each expense stores its own exchange rate (fixed at creation time),
 * so we use that rate for calculation instead of the current rate.
 *
 * @param members - List of all members
 * @param expenses - List of all expenses (each has its own rateToJPY)
 * @returns Array of member balances
 */
export function calculateBalances(members: Member[], expenses: Expense[]): MemberBalance[] {
  // Initialize balance map
  const balanceMap = new Map<string, number>();
  members.forEach((member) => {
    balanceMap.set(member.id, 0);
  });

  // Process each expense
  expenses.forEach((expense) => {
    // Convert amount to JPY using the rate fixed at expense creation time
    const amountInJPY = expense.amount * expense.rateToJPY;

    // Calculate per-person share (floor to avoid fractional yen)
    const splitCount = expense.splitAmong.length;
    if (splitCount === 0) return;

    const perPersonShare = Math.floor(amountInJPY / splitCount);

    // Add the collectible amount to the payer's balance (not the full amount)
    // This handles rounding - payer only credits what can be collected from splits
    // Example: 1000 yen split 3 ways = 333 each, so payer gets 999 credit (not 1000)
    const collectibleAmount = perPersonShare * splitCount;
    const payerBalance = balanceMap.get(expense.payerId) ?? 0;
    balanceMap.set(expense.payerId, payerBalance + collectibleAmount);

    // Subtract each person's share from their balance (they owe this much)
    expense.splitAmong.forEach((memberId) => {
      const memberBalance = balanceMap.get(memberId) ?? 0;
      balanceMap.set(memberId, memberBalance - perPersonShare);
    });
  });

  // Convert to MemberBalance array
  return members.map((member) => ({
    memberId: member.id,
    memberName: member.name,
    balance: Math.floor(balanceMap.get(member.id) ?? 0),
  }));
}

/**
 * Calculate optimal settlements to minimize the number of transactions
 * Uses a greedy algorithm: match largest creditor with largest debtor
 *
 * Algorithm based on Walica's implementation:
 * https://qiita.com/MasashiHamaguchi/items/0348082984b8c94ca581
 *
 * @param balances - Array of member balances
 * @returns Array of settlements (who pays whom how much)
 */
export function calculateSettlements(balances: MemberBalance[]): Settlement[] {
  const settlements: Settlement[] = [];

  // Clone to avoid mutation
  const remaining = balances.map((b) => ({
    memberId: b.memberId,
    balance: b.balance,
  }));

  // Threshold for considering a balance as zero (to handle rounding errors)
  const THRESHOLD = 1;

  while (true) {
    // Sort by balance (descending - largest creditor first)
    remaining.sort((a, b) => b.balance - a.balance);

    const creditor = remaining[0]; // Largest positive balance
    const debtor = remaining[remaining.length - 1]; // Largest negative balance

    // Check termination conditions
    if (!creditor || !debtor) break;
    if (creditor.balance <= THRESHOLD || debtor.balance >= -THRESHOLD) break;

    // Calculate transfer amount (minimum of what creditor should receive and what debtor owes)
    const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

    // Only record if amount is meaningful
    if (amount >= THRESHOLD) {
      settlements.push({
        from: debtor.memberId,
        to: creditor.memberId,
        amount: Math.floor(amount),
      });
    }

    // Update balances
    creditor.balance -= amount;
    debtor.balance += amount;
  }

  return settlements;
}

/**
 * Format amount as Japanese Yen
 * @param amount - Amount in JPY
 * @returns Formatted string (e.g., "¥1,234")
 */
export function formatJPY(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount);
}

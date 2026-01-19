/**
 * Group information
 */
export interface Group {
  id: string;
  name: string;
  createdAt: Date;
}

/**
 * Member information
 */
export interface Member {
  id: string;
  name: string;
}

/**
 * Expense record
 */
export interface Expense {
  id: string;
  /** Member ID of the payer */
  payerId: string;
  /** Amount in the specified currency */
  amount: number;
  /** Currency code (JPY, USD, EUR, etc.) */
  currency: string;
  /** Description of the expense */
  description: string;
  /** Array of member IDs to split among */
  splitAmong: string[];
  createdAt: Date;
}

/**
 * Currency information
 */
export interface Currency {
  /** Currency code (USD, EUR, etc.) */
  code: string;
  /** Currency symbol ($, €, etc.) */
  symbol: string;
  /** Currency name */
  name: string;
  /** Exchange rate to JPY */
  rateToJPY: number;
}

/**
 * Settlement transaction
 */
export interface Settlement {
  /** Member ID of the payer (debtor) */
  from: string;
  /** Member ID of the receiver (creditor) */
  to: string;
  /** Amount in JPY */
  amount: number;
}

/**
 * Member balance (positive = receives money, negative = pays money)
 */
export interface MemberBalance {
  memberId: string;
  memberName: string;
  /** Positive: creditor (receives) / Negative: debtor (pays) */
  balance: number;
}

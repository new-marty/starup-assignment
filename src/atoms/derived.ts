import { atom } from 'jotai';
import { membersAtom } from './group';
import { expensesAtom } from './expenses';
import { calculateBalances, calculateSettlements } from '@/lib/settlement';

/**
 * Derived atom that calculates balances for each member
 * Automatically recalculates when members or expenses change
 */
export const balancesAtom = atom((get) => {
  const members = get(membersAtom);
  const expenses = get(expensesAtom);
  return calculateBalances(members, expenses);
});

/**
 * Derived atom that calculates optimal settlements
 * Automatically recalculates when balances change
 */
export const settlementsAtom = atom((get) => {
  const balances = get(balancesAtom);
  return calculateSettlements(balances);
});

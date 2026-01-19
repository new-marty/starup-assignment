import { atom } from 'jotai';
import { membersAtom } from './group';
import { expensesAtom } from './expenses';
import { currenciesAtom } from './currencies';
import { calculateBalances, calculateSettlements } from '@/lib/settlement';

/**
 * Derived atom that calculates balances for each member
 * Automatically recalculates when members, expenses, or currencies change
 */
export const balancesAtom = atom((get) => {
  const members = get(membersAtom);
  const expenses = get(expensesAtom);
  const currencies = get(currenciesAtom);
  return calculateBalances(members, expenses, currencies);
});

/**
 * Derived atom that calculates optimal settlements
 * Automatically recalculates when balances change
 */
export const settlementsAtom = atom((get) => {
  const balances = get(balancesAtom);
  return calculateSettlements(balances);
});

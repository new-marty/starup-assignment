import { atom } from 'jotai';
import type { Expense } from '@/types';

/**
 * Atom for the list of expenses
 */
export const expensesAtom = atom<Expense[]>([]);

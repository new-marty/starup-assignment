import { atom } from 'jotai';
import type { Currency } from '@/types';

/**
 * Default currency (JPY)
 */
export const DEFAULT_CURRENCY: Currency = {
  code: 'JPY',
  symbol: '¥',
  name: '日本円',
  rateToJPY: 1,
};

/**
 * Atom for the list of available currencies with exchange rates
 */
export const currenciesAtom = atom<Currency[]>([DEFAULT_CURRENCY]);

/**
 * Atom for selected currencies (for international trips)
 */
export const selectedCurrenciesAtom = atom<string[]>(['JPY']);

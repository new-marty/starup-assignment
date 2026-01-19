import type { Currency } from '@/types';

/**
 * Common currencies with their Japanese names and symbols
 */
export const COMMON_CURRENCIES: Omit<Currency, 'rateToJPY'>[] = [
  { code: 'JPY', symbol: '¥', name: '日本円' },
  { code: 'USD', symbol: '$', name: '米ドル' },
  { code: 'EUR', symbol: '€', name: 'ユーロ' },
  { code: 'GBP', symbol: '£', name: '英ポンド' },
  { code: 'KRW', symbol: '₩', name: '韓国ウォン' },
  { code: 'CNY', symbol: '¥', name: '中国元' },
  { code: 'TWD', symbol: 'NT$', name: '台湾ドル' },
  { code: 'THB', symbol: '฿', name: 'タイバーツ' },
  { code: 'SGD', symbol: 'S$', name: 'シンガポールドル' },
  { code: 'AUD', symbol: 'A$', name: '豪ドル' },
  { code: 'CAD', symbol: 'C$', name: 'カナダドル' },
  { code: 'CHF', symbol: 'Fr', name: 'スイスフラン' },
];

/**
 * Fetch exchange rates from frankfurter.app
 * @param baseCurrency - Base currency code (default: JPY)
 * @param targetCurrencies - Array of target currency codes
 * @returns Object with currency codes as keys and rates as values
 */
export async function fetchExchangeRates(
  baseCurrency: string = 'JPY',
  targetCurrencies?: string[]
): Promise<Record<string, number>> {
  try {
    let url = `https://api.frankfurter.app/latest?base=${baseCurrency}`;
    if (targetCurrencies && targetCurrencies.length > 0) {
      url += `&symbols=${targetCurrencies.join(',')}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    return {};
  }
}

/**
 * Convert rates from base currency to rates-to-JPY
 * frankfurter.app returns rates FROM the base currency,
 * but we need rates TO JPY for our calculations
 *
 * @param ratesFromJPY - Rates from JPY to other currencies
 * @returns Rates to JPY (how many JPY per 1 unit of currency)
 */
export function convertToRatesToJPY(ratesFromJPY: Record<string, number>): Record<string, number> {
  const ratesToJPY: Record<string, number> = { JPY: 1 };

  Object.entries(ratesFromJPY).forEach(([code, rate]) => {
    // If 1 JPY = 0.0067 USD, then 1 USD = 1/0.0067 = ~149 JPY
    ratesToJPY[code] = rate > 0 ? 1 / rate : 0;
  });

  return ratesToJPY;
}

/**
 * Build Currency objects with exchange rates
 * @param selectedCodes - Array of currency codes to include
 * @param ratesToJPY - Rates to JPY
 * @returns Array of Currency objects
 */
export function buildCurrencies(
  selectedCodes: string[],
  ratesToJPY: Record<string, number>
): Currency[] {
  return selectedCodes
    .map((code) => {
      const currencyInfo = COMMON_CURRENCIES.find((c) => c.code === code);
      if (!currencyInfo) return null;

      return {
        ...currencyInfo,
        rateToJPY: ratesToJPY[code] ?? 1,
      };
    })
    .filter((c): c is Currency => c !== null);
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

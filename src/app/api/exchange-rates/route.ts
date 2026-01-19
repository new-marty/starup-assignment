import { NextRequest, NextResponse } from 'next/server';
import {
  fetchExchangeRates,
  convertToRatesToJPY,
  buildCurrencies,
  COMMON_CURRENCIES,
} from '@/lib/currency';

/**
 * GET /api/exchange-rates
 * Fetches exchange rates from frankfurter.app
 *
 * Query params:
 * - currencies: comma-separated list of currency codes (optional)
 *
 * @example GET /api/exchange-rates?currencies=USD,EUR,KRW
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currenciesParam = searchParams.get('currencies');

    // Parse target currencies
    const targetCurrencies = currenciesParam
      ? currenciesParam.split(',').map((c) => c.trim().toUpperCase())
      : COMMON_CURRENCIES.filter((c) => c.code !== 'JPY').map((c) => c.code);

    // Fetch rates from frankfurter.app (base: JPY)
    const ratesFromJPY = await fetchExchangeRates('JPY', targetCurrencies);

    // Convert to rates-to-JPY (how many JPY per 1 unit)
    const ratesToJPY = convertToRatesToJPY(ratesFromJPY);

    // Build currency objects
    const currencies = buildCurrencies(['JPY', ...targetCurrencies], ratesToJPY);

    return NextResponse.json({
      base: 'JPY',
      date: new Date().toISOString().split('T')[0],
      currencies,
    });
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    return NextResponse.json({ error: 'Failed to fetch exchange rates' }, { status: 500 });
  }
}

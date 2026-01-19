import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for settlement calculation rounding edge cases
 * Tests that balances sum to zero and settlements are correct
 */

test.describe('Settlement Rounding Edge Cases', () => {
  /**
   * Helper to create a group with members
   */
  async function createGroup(page: Page, groupName: string, members: string[]) {
    await page.goto('/');

    // Enter group name
    await page.getByPlaceholder('例: 北海道旅行').fill(groupName);

    // Add members
    for (const member of members) {
      await page.getByPlaceholder('名前を入力').fill(member);
      await page.getByRole('button', { name: '追加' }).click();
      // Wait for member to appear in the list
      await expect(page.getByText(member)).toBeVisible();
    }

    // Create the group
    await page.getByRole('button', { name: 'グループを作成' }).click();

    // Wait for navigation to group page
    await expect(page).toHaveURL('/group');
  }

  /**
   * Helper to add an expense
   */
  async function addExpense(
    page: Page,
    payer: string,
    amount: string,
    description: string,
    splitAmongAll: boolean = true
  ) {
    // Select payer - find the combobox in the expense form
    const expenseForm = page.locator('form');
    await expenseForm.locator('button[role="combobox"]').first().click();
    await page.getByRole('option', { name: payer }).click();

    // Enter amount
    await page.getByPlaceholder('0').fill(amount);

    // Enter description
    await page.getByPlaceholder('例: レンタカー代').fill(description);

    // Select split among
    if (splitAmongAll) {
      await page.getByRole('button', { name: '全員選択' }).click();
    }

    // Submit
    await page.getByRole('button', { name: '追加する' }).click();

    // Wait for the expense to appear and toast
    await page.waitForTimeout(500);
  }

  /**
   * Helper to get balances from the UI
   */
  async function getBalances(page: Page): Promise<Map<string, number>> {
    const balances = new Map<string, number>();

    // Wait for the balance summary to be visible
    await expect(page.getByText('収支バランス')).toBeVisible();

    // Find all balance entries by looking for the specific structure
    // Each entry is a div with bg-gray-50 class containing member name and balance
    const balanceCard = page.locator('text=収支バランス').locator('..').locator('..');
    const entries = balanceCard.locator('.bg-gray-50.rounded-lg');
    const count = await entries.count();

    for (let i = 0; i < count; i++) {
      const entry = entries.nth(i);
      const nameElement = entry.locator('span.font-medium');
      const balanceElement = entry.locator('span.font-bold');

      const name = await nameElement.textContent();
      const balanceText = await balanceElement.textContent();

      if (name && balanceText) {
        // Parse balance (remove +, ¥, ￥, commas)
        const cleanedBalance = balanceText.replace(/[+¥￥,]/g, '').trim();
        balances.set(name, parseInt(cleanedBalance, 10));
      }
    }

    return balances;
  }

  test('1000 yen split 3 ways should show correct balances', async ({ page }) => {
    await createGroup(page, 'テスト旅行', ['a', 'b', 'c']);
    await addExpense(page, 'a', '1000', 'ディナー');

    const balances = await getBalances(page);

    // 1000 / 3 = 333 per person
    // a: credits 999 (333*3), owes 333 → +666
    // b: credits 0, owes 333 → -333
    // c: credits 0, owes 333 → -333
    expect(balances.get('a')).toBe(666);
    expect(balances.get('b')).toBe(-333);
    expect(balances.get('c')).toBe(-333);

    // Verify balances sum to zero
    let total = 0;
    balances.forEach((v) => (total += v));
    expect(total).toBe(0);
  });

  test('100 yen split 3 ways should show correct balances', async ({ page }) => {
    await createGroup(page, 'テスト旅行', ['A', 'B', 'C']);
    await addExpense(page, 'A', '100', 'おやつ');

    const balances = await getBalances(page);

    // 100 / 3 = 33 per person
    // A: credits 99 (33*3), owes 33 → +66
    // B: credits 0, owes 33 → -33
    // C: credits 0, owes 33 → -33
    expect(balances.get('A')).toBe(66);
    expect(balances.get('B')).toBe(-33);
    expect(balances.get('C')).toBe(-33);

    // Verify balances sum to zero
    let total = 0;
    balances.forEach((v) => (total += v));
    expect(total).toBe(0);
  });

  test('clean division (900 / 3) should show correct balances', async ({ page }) => {
    await createGroup(page, 'テスト旅行', ['A', 'B', 'C']);
    await addExpense(page, 'A', '900', 'きれいな割り勘');

    const balances = await getBalances(page);

    // 900 / 3 = 300 per person (exact)
    // A: credits 900, owes 300 → +600
    // B: credits 0, owes 300 → -300
    // C: credits 0, owes 300 → -300
    expect(balances.get('A')).toBe(600);
    expect(balances.get('B')).toBe(-300);
    expect(balances.get('C')).toBe(-300);

    // Verify balances sum to zero
    let total = 0;
    balances.forEach((v) => (total += v));
    expect(total).toBe(0);
  });

  test('multiple expenses with rounding should balance correctly', async ({ page }) => {
    await createGroup(page, 'テスト旅行', ['A', 'B', 'C']);

    // First expense: 1000 / 3 = 333 each
    await addExpense(page, 'A', '1000', '食事1');

    // Second expense: 500 / 3 = 166 each
    await addExpense(page, 'B', '500', '食事2');

    const balances = await getBalances(page);

    // Expense 1: 1000/3=333, collectible=999
    // Expense 2: 500/3=166, collectible=498
    // A: credits 999, owes 333+166=499 → +500
    // B: credits 498, owes 333+166=499 → -1
    // C: credits 0, owes 333+166=499 → -499
    expect(balances.get('A')).toBe(500);
    expect(balances.get('B')).toBe(-1);
    expect(balances.get('C')).toBe(-499);

    // Verify balances sum to zero
    let total = 0;
    balances.forEach((v) => (total += v));
    expect(total).toBe(0);
  });

  test('4 members with odd amounts should balance correctly', async ({ page }) => {
    await createGroup(page, 'テスト旅行', ['A', 'B', 'C', 'D']);
    await addExpense(page, 'A', '1001', '奇数金額');

    const balances = await getBalances(page);

    // 1001 / 4 = 250 per person
    // Collectible: 250 * 4 = 1000
    // A: credits 1000, owes 250 → +750
    // Others: each -250
    expect(balances.get('A')).toBe(750);
    expect(balances.get('B')).toBe(-250);
    expect(balances.get('C')).toBe(-250);
    expect(balances.get('D')).toBe(-250);

    // Verify balances sum to zero
    let total = 0;
    balances.forEach((v) => (total += v));
    expect(total).toBe(0);
  });

  test('very small amounts (1 yen per person) should work', async ({ page }) => {
    await createGroup(page, 'テスト旅行', ['A', 'B']);
    await addExpense(page, 'A', '2', '小さい金額');

    const balances = await getBalances(page);

    // 2 / 2 = 1 per person
    // A: credits 2, owes 1 → +1
    // B: credits 0, owes 1 → -1
    expect(balances.get('A')).toBe(1);
    expect(balances.get('B')).toBe(-1);

    // Verify balances sum to zero
    let total = 0;
    balances.forEach((v) => (total += v));
    expect(total).toBe(0);
  });

  test('extreme edge case: 1 yen split 3 ways', async ({ page }) => {
    await createGroup(page, 'テスト旅行', ['A', 'B', 'C']);
    await addExpense(page, 'A', '1', '極小金額');

    const balances = await getBalances(page);

    // 1 / 3 = 0 per person
    // Collectible: 0 * 3 = 0
    // All balances should be 0
    expect(balances.get('A')).toBe(0);
    expect(balances.get('B')).toBe(0);
    expect(balances.get('C')).toBe(0);
  });

  test('2 yen split 3 ways edge case', async ({ page }) => {
    await createGroup(page, 'テスト旅行', ['A', 'B', 'C']);
    await addExpense(page, 'A', '2', '小額');

    const balances = await getBalances(page);

    // 2 / 3 = 0 per person
    // All balances should be 0
    expect(balances.get('A')).toBe(0);
    expect(balances.get('B')).toBe(0);
    expect(balances.get('C')).toBe(0);
  });

  test('settlements display correct transfers after rounding', async ({ page }) => {
    await createGroup(page, 'テスト旅行', ['a', 'b', 'c']);
    await addExpense(page, 'a', '1000', 'ディナー');

    // Check that settlement section exists (use exact match to avoid matching description)
    await expect(page.getByText('精算方法', { exact: true })).toBeVisible();

    // Find settlement entries - they are in bg-orange-50 divs
    const settlementCard = page.getByText('精算方法', { exact: true }).locator('..').locator('..');
    const settlements = settlementCard.locator('.bg-orange-50');

    // Should have 2 settlements (b→a and c→a)
    await expect(settlements).toHaveCount(2);

    // Each settlement should show ¥333
    const firstAmount = await settlements.first().locator('.text-orange-600.text-lg').textContent();
    const secondAmount = await settlements.nth(1).locator('.text-orange-600.text-lg').textContent();

    // Both should be ¥333
    expect(firstAmount).toContain('333');
    expect(secondAmount).toContain('333');
  });

  test('balanced group (everyone pays their share) shows zero balances', async ({ page }) => {
    await createGroup(page, 'テスト旅行', ['A', 'B', 'C']);

    // A pays 300 for everyone
    await addExpense(page, 'A', '300', '食事1');

    // B pays 300 for everyone
    await addExpense(page, 'B', '300', '食事2');

    // C pays 300 for everyone
    await addExpense(page, 'C', '300', '食事3');

    const balances = await getBalances(page);

    // Each person paid 300, each owes 100 to each expense (300 total)
    // Net: 0 for everyone
    expect(balances.get('A')).toBe(0);
    expect(balances.get('B')).toBe(0);
    expect(balances.get('C')).toBe(0);

    // Verify balances sum to zero
    let total = 0;
    balances.forEach((v) => (total += v));
    expect(total).toBe(0);
  });
});

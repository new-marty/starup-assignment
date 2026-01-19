import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { CreateGroupForm } from '@/components/group/create-group-form';
import { groupAtom, membersAtom, expensesAtom, selectedCurrenciesAtom } from '@/atoms';
import type { Member, Expense, Group } from '@/types';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('CreateGroupForm', () => {
  it('should reset all state when component mounts', async () => {
    const store = createStore();

    // Pre-populate store with "previous group" data
    const previousGroup: Group = {
      id: 'prev-group-id',
      name: 'Previous Trip',
      createdAt: new Date(),
    };
    const previousMembers: Member[] = [
      { id: 'm1', name: 'Alice' },
      { id: 'm2', name: 'Bob' },
    ];
    const previousExpenses: Expense[] = [
      {
        id: 'e1',
        payerId: 'm1',
        amount: 1000,
        currency: 'JPY',
        rateToJPY: 1,
        description: 'Dinner',
        splitAmong: ['m1', 'm2'],
        createdAt: new Date(),
      },
    ];

    store.set(groupAtom, previousGroup);
    store.set(membersAtom, previousMembers);
    store.set(expensesAtom, previousExpenses);
    store.set(selectedCurrenciesAtom, ['JPY', 'USD', 'EUR']);

    // Verify initial state has previous data
    expect(store.get(groupAtom)).toEqual(previousGroup);
    expect(store.get(membersAtom)).toEqual(previousMembers);
    expect(store.get(expensesAtom)).toEqual(previousExpenses);
    expect(store.get(selectedCurrenciesAtom)).toEqual(['JPY', 'USD', 'EUR']);

    // Render CreateGroupForm (simulating navigation to create new group)
    render(
      <Provider store={store}>
        <CreateGroupForm />
      </Provider>
    );

    // Wait for useEffect to run and reset state
    await waitFor(() => {
      expect(store.get(groupAtom)).toBeNull();
    });

    // Verify all state has been reset
    expect(store.get(groupAtom)).toBeNull();
    expect(store.get(membersAtom)).toEqual([]);
    expect(store.get(expensesAtom)).toEqual([]);
    expect(store.get(selectedCurrenciesAtom)).toEqual(['JPY']);
  });

  it('should show empty member list after reset', async () => {
    const store = createStore();

    // Pre-populate with previous members
    const previousMembers: Member[] = [
      { id: 'm1', name: 'Alice' },
      { id: 'm2', name: 'Bob' },
    ];
    store.set(membersAtom, previousMembers);

    render(
      <Provider store={store}>
        <CreateGroupForm />
      </Provider>
    );

    // Wait for reset and verify UI shows no members
    await waitFor(() => {
      expect(screen.getByText('メンバーを追加してください')).toBeInTheDocument();
    });

    // Previous member names should not be visible
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('should have disabled create button after reset (no members)', async () => {
    const store = createStore();

    // Pre-populate with previous members
    store.set(membersAtom, [
      { id: 'm1', name: 'Alice' },
      { id: 'm2', name: 'Bob' },
    ]);

    render(
      <Provider store={store}>
        <CreateGroupForm />
      </Provider>
    );

    // Wait for reset
    await waitFor(() => {
      expect(store.get(membersAtom)).toEqual([]);
    });

    // Create button should be disabled (needs 2+ members)
    const createButton = screen.getByRole('button', { name: 'グループを作成' });
    expect(createButton).toBeDisabled();
  });
});

'use client';

import { Provider } from 'jotai';
import type { ReactNode } from 'react';

interface JotaiProviderProps {
  children: ReactNode;
}

/**
 * Jotai Provider wrapper for client-side state management
 * This component must be a Client Component ("use client")
 */
export function JotaiProvider({ children }: JotaiProviderProps) {
  return <Provider>{children}</Provider>;
}

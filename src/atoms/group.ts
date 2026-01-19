import { atom } from 'jotai';
import type { Group, Member } from '@/types';

/**
 * Atom for the current group
 */
export const groupAtom = atom<Group | null>(null);

/**
 * Atom for the list of members in the group
 */
export const membersAtom = atom<Member[]>([]);

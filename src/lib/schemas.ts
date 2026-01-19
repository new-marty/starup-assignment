import { z } from 'zod';

/**
 * Schema for creating a new group
 * Error messages are in Japanese for user-facing UI
 */
export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'グループ名を入力してください')
    .max(50, 'グループ名は50文字以内で入力してください'),
});

/**
 * Schema for adding a new member
 */
export const addMemberSchema = z.object({
  name: z
    .string()
    .min(1, 'メンバー名を入力してください')
    .max(20, 'メンバー名は20文字以内で入力してください'),
});

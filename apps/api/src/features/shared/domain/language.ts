import { z } from 'zod';

export type Language = z.infer<typeof languageSchema>;
export const languageSchema = z.enum(['javascript', 'typescript']);
export const languageEnum = languageSchema.enum;
export const languageList = languageSchema.options;

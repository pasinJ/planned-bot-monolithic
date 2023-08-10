import z from 'zod';

const themeSchema = z.enum(['light', 'dark']);
export const themeEnum = themeSchema.enum;
export type Theme = z.infer<typeof themeSchema>;

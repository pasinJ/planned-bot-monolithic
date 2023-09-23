import { z } from 'zod';

export type ValidDate = z.infer<typeof validDateSchema>;
export const validDateSchema = z.date().brand('ValidDate');

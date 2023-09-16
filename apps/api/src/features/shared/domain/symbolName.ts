import { z } from 'zod';

import { nonEmptyString } from '#shared/utils/zod.schema.js';

export type SymbolName = z.infer<typeof symbolNameSchema>;
export const symbolNameSchema = nonEmptyString.brand('SymbolName');

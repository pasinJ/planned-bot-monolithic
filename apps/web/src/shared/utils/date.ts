import { z } from 'zod';

import { schemaForType } from './zod';

export type ValidDate = Date & z.BRAND<'ValidDate'>;
export const validDateSchema = schemaForType<ValidDate>().with(z.date().brand('ValidDate'));

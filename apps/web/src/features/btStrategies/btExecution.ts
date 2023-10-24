import { z } from 'zod';

import { schemaForType } from '#shared/utils/zod';

export type BtExecutionId = string & z.BRAND<'BtExecutionId'>;
export const btExecutionId = schemaForType<BtExecutionId>().with(z.string().brand('BtExecutionId'));

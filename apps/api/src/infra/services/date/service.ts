import io from 'fp-ts/lib/IO.js';

import { ValidDate } from '#shared/utils/date.js';

export type DateService = Readonly<{ getCurrentDate: io.IO<ValidDate> }>;

export const dateService: DateService = { getCurrentDate: () => new Date() as ValidDate };

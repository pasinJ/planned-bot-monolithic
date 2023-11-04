import * as io from 'fp-ts/lib/IO';

import { ValidDate } from '#shared/utils/date';
import { TimezoneString } from '#shared/utils/string';

export type DateService = { getCurrentDate: io.IO<ValidDate>; getTimezone: io.IO<TimezoneString> };

export const dateService: DateService = {
  getCurrentDate: () => new Date() as ValidDate,
  getTimezone: () => Intl.DateTimeFormat().resolvedOptions().timeZone as TimezoneString,
};

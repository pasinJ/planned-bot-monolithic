import io from 'fp-ts/lib/IO.js';

export type DateService = { getCurrentDate: io.IO<Date> };

export const dateService: DateService = { getCurrentDate: () => new Date() };

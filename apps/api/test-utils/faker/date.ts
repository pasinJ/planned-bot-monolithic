import { faker } from '@faker-js/faker';

import { ValidDate } from '#shared/utils/date.js';

export const invalidDate = new Date('invalid');
export const randomDate = () => faker.date.anytime() as ValidDate;
export const randomDateBefore = (date: Date) => faker.date.past({ refDate: date }) as ValidDate;
export const randomDateAfter = (date: Date) => faker.date.future({ refDate: date }) as ValidDate;

export const randomBeforeAndAfterDateInFuture = (refDate?: Date) => {
  const before = faker.date.future({ refDate }) as ValidDate;
  const after = faker.date.future({ refDate: before }) as ValidDate;

  return { before, after };
};

export const randomBeforeAndAfterDateInPast = (refDate?: Date) => {
  const after = faker.date.past({ refDate }) as ValidDate;
  const before = faker.date.past({ refDate: after }) as ValidDate;

  return { before, after };
};

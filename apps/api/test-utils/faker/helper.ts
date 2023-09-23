import { faker } from '@faker-js/faker';

export const generateArrayOf = <T>(fn: () => T, length = 3) => faker.helpers.multiple(fn, { count: length });

import { z } from 'zod';

import { IntegerString } from '#shared/utils/string';

export const nonNegativeIntegerStringLoose = z.string().regex(/^\d*$/);
export const integerStringLoose = z.string().regex(/^-?\d*$/);

export function formatIntegerString(value: string): IntegerString {
  let formattedValue = value;
  if (formattedValue.match(/^0+[^.]/)) formattedValue = formattedValue.replace(/^0+/, '');
  if (formattedValue.match(/^-0+[^.]/)) formattedValue = formattedValue.replace(/^-0+/, '-');

  return formattedValue as IntegerString;
}

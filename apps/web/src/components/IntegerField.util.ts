import { z } from 'zod';

export const nonNegativeIntegerStringLoose = z.string().regex(/^\d*$/);
export const integerStringLoose = z.string().regex(/^-?\d*$/);

export function formatIntegerString(value: string): string {
  let formattedValue = value;
  if (formattedValue.match(/^0+[^.]/)) formattedValue = formattedValue.replace(/^0+/, '');
  if (formattedValue.match(/^-0+[^.]/)) formattedValue = formattedValue.replace(/^-0+/, '-');

  return formattedValue;
}

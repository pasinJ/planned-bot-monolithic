import { z } from 'zod';

/**
 * Decimal string that allows leading and trailing zero, and also starting and ending with decimal point.
 *
 * Should be used in cause of component input validation with onChange property (and add final formating to the component with onBlur property).
 */
export const decimalStringLoose = z.string().regex(/^\d*\.?\d*$/);

export function formatDecimalString(value: string) {
  let formattedValue = value;
  if (formattedValue.match(/^0+[^.]/)) formattedValue = formattedValue.replace(/^0+/, '');
  if (formattedValue.match(/\.\d+0+$/)) formattedValue = formattedValue.replace(/0+$/, '');
  if (formattedValue.match(/^\./)) formattedValue = '0' + formattedValue;
  if (formattedValue.match(/\.$/)) formattedValue = formattedValue + '0';

  return formattedValue;
}

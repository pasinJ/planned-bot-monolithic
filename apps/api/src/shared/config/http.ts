import { z } from 'zod';

import { nonEmptyStringSchema } from './config.util.js';

export type HttpConfig = { PORT_NUMBER: PortNumber };

export type PortNumber = z.infer<typeof portNumberSchema>;
const portNumberSchema = nonEmptyStringSchema
  .pipe(z.coerce.number().int().positive())
  .catch(80)
  .brand('PortNumber');

export function getHttpConfig(): HttpConfig {
  return { PORT_NUMBER: portNumberSchema.parse(process.env.HTTP_PORT_NUMBER) };
}

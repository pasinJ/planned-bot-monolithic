import io from 'fp-ts/lib/IO.js';
import { z } from 'zod';

import { nonEmptyString } from '#shared/utils/zod.schema.js';

export type HttpConfig = { PORT_NUMBER: PortNumber };

export type PortNumber = z.infer<typeof portNumberSchema>;
const portNumberSchema = nonEmptyString
  .pipe(z.coerce.number().int().positive())
  .catch(80)
  .brand('PortNumber');

export const getHttpConfig: io.IO<HttpConfig> = () => {
  return { PORT_NUMBER: portNumberSchema.parse(process.env.HTTP_PORT_NUMBER) };
};

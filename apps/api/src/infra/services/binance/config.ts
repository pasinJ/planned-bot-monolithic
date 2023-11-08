import io from 'fp-ts/lib/IO.js';
import { z } from 'zod';

import { nonEmptyStringSchema } from '#shared/utils/string.js';

export type BnbConfig = { HTTP_BASE_URL: string; PUBLIC_DATA_BASE_URL: string; DOWNLOAD_OUTPUT_PATH: string };

const httpBaseUrlSchema = nonEmptyStringSchema.pipe(z.string().url()).catch('https://api.binance.com');
const publicDataBaseUrlSchema = nonEmptyStringSchema
  .pipe(z.string().url())
  .catch('https://data.binance.vision');

export const getBnbConfig: io.IO<BnbConfig> = () => {
  return {
    HTTP_BASE_URL: httpBaseUrlSchema.parse(process.env.BNB_HTTP_BASE_URL),
    PUBLIC_DATA_BASE_URL: publicDataBaseUrlSchema.parse(process.env.BNB_PUBLIC_DATA_BASE_URL),
    DOWNLOAD_OUTPUT_PATH: nonEmptyStringSchema.catch('./downloads').parse(process.env.DOWNLOAD_OUTPUT_PATH),
  };
};

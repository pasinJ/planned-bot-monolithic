import io from 'fp-ts/lib/IO.js';

import { nonEmptyString } from '#shared/utils/zod.schema.js';

export type BnbConfig = { HTTP_BASE_URL: string; PUBLIC_DATA_BASE_URL: string; DOWNLOAD_OUTPUT_PATH: string };

const httpBaseUrlSchema = nonEmptyString.url().catch('https://api.binance.com');
const publicDataBaseUrlSchema = nonEmptyString.url().catch('https://data.binance.vision');

export const getBnbConfig: io.IO<BnbConfig> = () => {
  return {
    HTTP_BASE_URL: httpBaseUrlSchema.parse(process.env.BNB_HTTP_BASE_URL),
    PUBLIC_DATA_BASE_URL: publicDataBaseUrlSchema.parse(process.env.BNB_PUBLIC_DATA_BASE_URL),
    DOWNLOAD_OUTPUT_PATH: nonEmptyString.catch('./downloads').parse(process.env.DOWNLOAD_OUTPUT_PATH),
  };
};

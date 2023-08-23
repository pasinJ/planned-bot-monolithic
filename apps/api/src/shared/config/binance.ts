import io from 'fp-ts/lib/IO.js';

import { nonEmptyString } from '#shared/common.type.js';

export type BnbConfig = {
  HTTP_BASE_URL: string;
};

const httpBaseUrlSchema = nonEmptyString.url().catch('https://api.binance.com');

export const getBnbConfig: io.IO<BnbConfig> = () => {
  return { HTTP_BASE_URL: httpBaseUrlSchema.parse(process.env.BNB_HTTP_BASE_URL) };
};

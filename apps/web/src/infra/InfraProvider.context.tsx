import { mergeDeepRight } from 'ramda';
import { PropsWithChildren, createContext } from 'react';
import { DeepPartial } from 'ts-essentials';

import { createBtStrategyRepo } from '#features/btStrategies/btStrategy.repository';
import { createKlineRepo } from '#features/klines/kline.repository';
import { createSymbolRepo } from '#features/symbols/symbol.repository';

import { createAxiosHttpClient } from './axiosHttpClient';
import { dateService } from './dateService';
import { API_BASE_URL } from './httpClient.constant';

const httpClient = createAxiosHttpClient({ baseURL: API_BASE_URL });
const defaultContext = {
  localStorage: window.localStorage,
  eventEmitter: new EventTarget(),
  symbolRepo: createSymbolRepo({ httpClient }),
  btStrategyRepo: createBtStrategyRepo({ httpClient }),
  klineRepo: createKlineRepo({ httpClient }),
  dateService,
};

export type InfraContextValue = typeof defaultContext;
export const InfraContext = createContext(defaultContext);

export default function InfraProvider({
  children,
  overrides = {},
}: PropsWithChildren<{ overrides?: DeepPartial<InfraContextValue> }>) {
  return (
    <InfraContext.Provider value={mergeDeepRight(defaultContext, overrides)}>
      {children}
    </InfraContext.Provider>
  );
}

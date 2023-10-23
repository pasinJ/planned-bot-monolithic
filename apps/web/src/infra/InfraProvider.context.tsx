import { PropsWithChildren, createContext } from 'react';

import { createBtStrategyRepo } from '#features/backtesting-strategies/repositories/btStrategy';
import { createKlineRepo } from '#features/klines/kline.repository';
import { createSymbolRepo } from '#features/symbols/repositories/symbol';

import { createAxiosHttpClient } from './axiosHttpClient';
import { API_BASE_URL } from './httpClient.constant';

const httpClient = createAxiosHttpClient({ baseURL: API_BASE_URL });
const defaultContext = {
  localStorage: window.localStorage,
  eventEmitter: new EventTarget(),
  symbolRepo: createSymbolRepo({ httpClient }),
  btStrategyRepo: createBtStrategyRepo({ httpClient }),
  klineRepo: createKlineRepo({ httpClient }),
};

export type InfraContextValue = typeof defaultContext;
export const InfraContext = createContext(defaultContext);

export default function InfraProvider({
  children,
  overrides = {},
}: PropsWithChildren<{ overrides?: Partial<InfraContextValue> }>) {
  return (
    <InfraContext.Provider value={{ ...defaultContext, ...overrides }}>{children}</InfraContext.Provider>
  );
}

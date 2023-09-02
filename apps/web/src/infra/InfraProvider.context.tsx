import { PropsWithChildren, createContext } from 'react';

import { createBtStrategyRepo } from '#features/backtesting-strategies/repositories/btStrategy';
import { createSymbolRepo } from '#features/symbols/repositories/symbol';

import { createAxiosHttpClient } from './axiosHttpClient';

const httpClient = createAxiosHttpClient();
const defaultContext = {
  localStorage: window.localStorage,
  eventEmitter: new EventTarget(),
  httpClient,
  symbolRepo: createSymbolRepo({ httpClient }),
  btStrategyRepo: createBtStrategyRepo({ httpClient }),
};

export type InfraContextValue = typeof defaultContext;
export const InfraContext = createContext(defaultContext);

export default function InfraProvider({
  children,
  init = {},
}: PropsWithChildren<{ init?: Partial<InfraContextValue> }>) {
  return <InfraContext.Provider value={{ ...defaultContext, ...init }}>{children}</InfraContext.Provider>;
}

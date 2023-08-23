import { PropsWithChildren, createContext } from 'react';

import { createAxiosHttpClient } from './axiosHttpClient';

const defaultContext = {
  localStorage: window.localStorage,
  eventEmitter: new EventTarget(),
  httpClient: createAxiosHttpClient(),
};

export type InfraContextValue = typeof defaultContext;
export const InfraContext = createContext(defaultContext);

export default function InfraProvider({
  children,
  init = {},
}: PropsWithChildren<{ init?: Partial<InfraContextValue> }>) {
  return <InfraContext.Provider value={{ ...defaultContext, ...init }}>{children}</InfraContext.Provider>;
}

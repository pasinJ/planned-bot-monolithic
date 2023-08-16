import { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { setupStore } from './store';

export default function ClientStateProvider({ children }: PropsWithChildren) {
  const store = setupStore();
  return <Provider store={store}>{children}</Provider>;
}

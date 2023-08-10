import { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { setupStore } from 'src/store';

export default function StateProvider({ children }: PropsWithChildren) {
  const store = setupStore();
  return <Provider store={store}>{children}</Provider>;
}

import { Query, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { is } from 'ramda';
import { PropsWithChildren } from 'react';
import toast from 'react-hot-toast';

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onErrorQuery }),
});

export default function ServerStateProvider({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function onErrorQuery(error: unknown, query: Query<unknown, unknown, unknown>): void {
  const transformedError = is(String, error)
    ? error
    : error instanceof Error
    ? `[${error.name}] ${error.message}`
    : JSON.stringify(error);

  if (query.state.data !== undefined) toast.error(`Something went wrong: ${transformedError}`);
}

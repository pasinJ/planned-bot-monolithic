import { UseQueryResult } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { AnyFunction, Tail } from 'ts-essentials';

export default function useAutoFetch<
  D,
  E,
  F extends
    | AnyFunction<[boolean], UseQueryResult<D, E>>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | AnyFunction<[boolean, ...any[]], UseQueryResult<D, E>>,
>(initialValue: boolean, queryHook: F, queryHookParams?: Tail<Parameters<F>>): [ReturnType<F>, () => void] {
  const [autoFetch, setAutoFetch] = useState(initialValue);
  const queryResult = queryHook(autoFetch, ...(queryHookParams ?? []));
  const handleRetryFetch = useCallback(() => setAutoFetch(true), []);
  if (queryResult.isError && autoFetch) setAutoFetch(false);

  return [queryResult as ReturnType<F>, handleRetryFetch];
}

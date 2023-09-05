import * as io from 'fp-ts/lib/IO';
import * as o from 'fp-ts/lib/Option';
import { constVoid, pipe } from 'fp-ts/lib/function';
import { useContext } from 'react';

import { InfraContext } from '#infra/InfraProvider.context';

type UseLocalStorageResult<T extends string> = {
  get: () => o.Option<T>;
  set: (val: T) => io.IO<void>;
  remove: io.IO<void>;
  subscribe: (listener: (event: Event) => void) => io.IO<void>;
  unsubscribe: (listener: (event: Event) => void) => io.IO<void>;
};

export default function useLocalStorage<T extends string>(deps: { key: string }): UseLocalStorageResult<T> {
  const { key } = deps;
  const eventName = `storage:${key}`;
  const { localStorage, eventEmitter } = useContext(InfraContext);

  return {
    get: () => o.fromNullable(localStorage.getItem(key) as T),
    set: (val) => {
      return pipe(
        () => localStorage.setItem(key, val),
        io.map(() => eventEmitter.dispatchEvent(new Event(eventName))),
        io.map(constVoid),
      );
    },
    remove: pipe(
      () => localStorage.removeItem(key),
      io.map(() => eventEmitter.dispatchEvent(new Event(eventName))),
      io.map(constVoid),
    ),
    subscribe: (listener) => () => eventEmitter.addEventListener(eventName, listener),
    unsubscribe: (listener) => () => eventEmitter.removeEventListener(eventName, listener),
  };
}

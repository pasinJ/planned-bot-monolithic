import { equals } from 'ramda';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';

import { isFunction } from '#shared/utils/typeGuards';

export default function useObjState<T>(initialState: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(initialState);

  const setObjState: Dispatch<SetStateAction<T>> = useCallback((newValue) => {
    if (isFunction(newValue)) {
      setState(newValue);
    } else {
      setState((prev) => (equals(prev, newValue) ? prev : newValue));
    }
  }, []);

  return [state, setObjState];
}

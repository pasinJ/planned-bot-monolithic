import * as o from 'fp-ts/lib/Option';
import { equals } from 'ramda';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';

import { isFunction } from '#shared/utils/typeGuards';

export default function useOptionState<T>(
  initialState: o.Option<T> = o.none,
): [o.Option<T>, Dispatch<SetStateAction<o.Option<T>>>] {
  const [state, setState] = useState(initialState);

  const setOptionState: Dispatch<SetStateAction<o.Option<T>>> = useCallback((newValue) => {
    if (isFunction(newValue)) {
      setState((prev) => newValue(prev));
    } else {
      setState((prev) =>
        o.isNone(prev) && o.isNone(newValue)
          ? prev
          : o.isSome(prev) && o.isSome(newValue)
          ? equals(prev.value, newValue.value)
            ? prev
            : newValue
          : newValue,
      );
    }
  }, []);

  return [state, setOptionState];
}

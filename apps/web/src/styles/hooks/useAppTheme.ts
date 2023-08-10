import { useMediaQuery } from '@mui/material';
import { execute as executeIO } from 'fp-ts-std/IO';
import * as io from 'fp-ts/lib/IO';
import * as o from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';
import { equals } from 'ramda';
import { useCallback, useSyncExternalStore } from 'react';

import useLocalStorage from '#hooks/useLocalStorage';
import { Theme, themeEnum } from '#styles/theme.schema';

type UseAppThemeResult = { appTheme: Theme; setTheme: (val: Theme) => io.IO<void>; removeTheme: io.IO<void> };

export default function useAppTheme(): UseAppThemeResult {
  const preferDark = useMediaQuery('(prefers-color-scheme: dark)');
  const themeLocalStorage = useLocalStorage<Theme>({ key: 'theme' });

  const shouldDisplayDark = (localTheme: o.Option<Theme>, preferDark: boolean): boolean =>
    o.elem({ equals })(themeEnum.dark, localTheme) || (o.isNone(localTheme) && preferDark);

  const subscribeToRepo = useCallback(
    (onChange: () => void) => {
      executeIO(themeLocalStorage.subscribe(onChange));
      return themeLocalStorage.unsubscribe(onChange);
    },
    [themeLocalStorage],
  );
  const appTheme: Theme = useSyncExternalStore(
    subscribeToRepo,
    pipe(
      themeLocalStorage.get,
      io.map((currentTheme) =>
        shouldDisplayDark(currentTheme, preferDark) ? themeEnum.dark : themeEnum.light,
      ),
    ),
  );

  return { appTheme, setTheme: themeLocalStorage.set, removeTheme: themeLocalStorage.remove };
}

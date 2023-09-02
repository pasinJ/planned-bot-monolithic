import Switch from '@mui/material/Switch';

import useAppTheme from '#styles/hooks/useAppTheme';
import { themeEnum } from '#styles/theme.type';

export default function ThemeSwitch() {
  const { appTheme, setTheme } = useAppTheme();
  const displayDark = appTheme === themeEnum.dark;

  const handleChange = setTheme(displayDark ? themeEnum.light : themeEnum.dark);

  return (
    <Switch
      checked={displayDark}
      onChange={handleChange}
      className="w-15 h-8 p-1.5"
      classes={{
        switchBase: 'm-0.5 p-0 translate-x-1',
        checked: 'text-white translate-x-6',
        track: 'rounded-full opacity-100 bg-gray-400',
        thumb:
          'w-7 h-7 bg-gray-100 dark:bg-gray-700 content-lightModeSym dark:content-darkModeSym  before:font-materialSymbols before:h-full before:w-full before:flex before:items-center before:justify-center before:text-black before:dark:text-white before:text-lg',
      }}
    />
  );
}

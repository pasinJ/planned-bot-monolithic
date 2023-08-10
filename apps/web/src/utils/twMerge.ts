import { pipe } from 'fp-ts/lib/function';
import { map, range, toString } from 'ramda';
import { extendTailwindMerge } from 'tailwind-merge';

export default extendTailwindMerge({
  theme: {
    screen: ['sm', 'md', 'lg'],
    colors: [
      { primary: ['light', 'dark'] },
      { secondary: ['light', 'dark'] },
      { success: ['light', 'dark'] },
      { info: ['light', 'dark'] },
      { warn: ['light', 'dark'] },
      { error: ['light', 'dark'] },
      {
        textColor: [
          'secondary',
          'disabled',
          'onPrimary',
          'onSecondary',
          'onSuccess',
          'onInfo',
          'onWarn',
          'onError',
        ],
      },
      'outline',
      'background',
      'surface',
    ],
  },
  classGroups: {
    boxShadow: pipe(range(0, 24), map(toString)),
    content: ['empty', 'lightModeSym', 'darkModeSym'],
    display: ['revert'],
  },
});

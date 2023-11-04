import * as o from 'fp-ts/lib/Option';
import { createContext } from 'react';

import type { SeriesObj } from './Series';

export const SeriesContext = createContext<o.Option<SeriesObj>>(o.none);

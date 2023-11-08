import * as o from 'fp-ts/lib/Option';
import { createContext } from 'react';

import type { ChartGroupObj } from './ChartGroup';

export const ChartGroupContext = createContext<o.Option<ChartGroupObj>>(o.none);

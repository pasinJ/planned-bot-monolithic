import * as o from 'fp-ts/lib/Option';
import { createContext } from 'react';

import type { ChartObj } from './ChartContainer';

export const ChartContext = createContext<o.Option<ChartObj>>(o.none);

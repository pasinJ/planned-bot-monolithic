import * as o from 'fp-ts/lib/Option.js';
import { Ref, useImperativeHandle, useRef } from 'react';

import { SeriesObj } from '../Series';

export default function useSeriesObjRef(ref: Ref<unknown>) {
  const series = useRef<o.Option<SeriesObj>>(o.none);
  useImperativeHandle(ref, () => series.current, []);

  return series;
}

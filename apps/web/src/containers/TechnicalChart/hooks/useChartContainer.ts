import * as o from 'fp-ts/lib/Option';
import { useCallback, useState } from 'react';

export default function useChartContainer() {
  const [container, setContainer] = useState<o.Option<HTMLDivElement>>(o.none);
  const handleContainerRef = useCallback((ref: HTMLDivElement) => setContainer(o.some(ref)), []);

  return { container, handleContainerRef };
}

import CircularProgress from '@mui/material/CircularProgress';
import { ComponentType, Suspense, lazy } from 'react';

type DynamicImportType = () => Promise<{ default: ComponentType<unknown> }>;
type LazyWrapperProps = { component: DynamicImportType };

export default function LazyWrapper({ component }: LazyWrapperProps) {
  const LazyComponent = lazy(component);
  return (
    <Suspense fallback={<CircularProgress className="abs-center" />}>
      <LazyComponent />
    </Suspense>
  );
}

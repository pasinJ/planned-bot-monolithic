import { ComponentType, Suspense, lazy } from 'react';

type DynamicImportType = () => Promise<{ default: ComponentType<unknown> }>;
type LazyWrapperProps = { component: DynamicImportType };

export default function LazyWrapper({ component }: LazyWrapperProps) {
  const LazyComponent = lazy(component);
  return (
    <Suspense
      fallback={
        <div className="">
          <div className="">Loading ...</div>
        </div>
      }
    >
      <LazyComponent />
    </Suspense>
  );
}

import { PreloadedState } from '@reduxjs/toolkit';
import { render, renderHook } from '@testing-library/react';
import { pipe } from 'fp-ts/lib/function';
import { PropsWithChildren, ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';

import InfraProvider, { InfraContextValue } from '#infra/InfraProvider.context';
import { RootState, setupStore } from '#state/store';

export function renderWithContexts(
  ui: ReactElement,
  contexts: { state?: PreloadedState<RootState>; infraContext?: Partial<InfraContextValue> } = {},
) {
  return render(ui, { wrapper: ContextWrapper(contexts) });
}

export function renderHookWithContexts<R>(
  hook: () => R,
  contexts: { state?: PreloadedState<RootState>; infraContext?: Partial<InfraContextValue> } = {},
) {
  return renderHook(() => hook(), { wrapper: ContextWrapper(contexts) });
}

function ContextWrapper(
  contexts: { state?: PreloadedState<RootState>; infraContext?: Partial<InfraContextValue> } = {},
) {
  const StateWrapper = (ui: ReactNode, state?: PreloadedState<RootState>) => (
    <Provider store={setupStore(state)}>{ui}</Provider>
  );
  const InfraWrapper = (infraContext?: Partial<InfraContextValue>) => (ui: ReactNode) => (
    <InfraProvider init={infraContext}>{ui}</InfraProvider>
  );

  return ({ children }: PropsWithChildren) =>
    contexts.state && contexts.infraContext ? (
      pipe(StateWrapper(children, contexts.state), InfraWrapper(contexts.infraContext))
    ) : !contexts.state && contexts.infraContext ? (
      InfraWrapper(contexts.infraContext)(children)
    ) : contexts.state && !contexts.infraContext ? (
      StateWrapper(children)
    ) : (
      <>{children}</>
    );
}

export function cleanupDocument() {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
}

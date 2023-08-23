import { PreloadedState } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook } from '@testing-library/react';
import { flow } from 'fp-ts/lib/function';
import { includes } from 'ramda';
import { PropsWithChildren, ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { RouteObject, RouterProvider, createMemoryRouter } from 'react-router-dom';

import InfraProvider, { InfraContextValue } from '#infra/InfraProvider.context';
import { RootState, setupStore } from '#state/store';
import StyleProvider from '#styles/containers/StyleProvider';

type Layer = 'Infra' | 'ClientState' | 'ServerState' | 'Style' | 'Routes';

export function renderWithContexts(
  ui: ReactElement,
  layers: Layer[],
  contexts: {
    clientState?: PreloadedState<RootState>;
    infraContext?: Partial<InfraContextValue>;
    routes?: RouteObject[];
  } = {},
) {
  return render(ui, { wrapper: ContextWrapper(layers, contexts) });
}

export function renderHookWithContexts<R>(
  hook: () => R,
  layers: Layer[],
  contexts: {
    clientState?: PreloadedState<RootState>;
    infraContext?: Partial<InfraContextValue>;
    routes?: RouteObject[];
  } = {},
) {
  return renderHook(() => hook(), { wrapper: ContextWrapper(layers, contexts) });
}

export function renderWithAppContext(
  ui: ReactElement,
  contexts: {
    clientState?: PreloadedState<RootState>;
    infraContext?: Partial<InfraContextValue>;
    routes?: RouteObject[];
  } = {},
) {
  return render(ui, {
    wrapper: ({ children }: PropsWithChildren) =>
      flow(
        RoutesWrapper(contexts.routes),
        StyleWrapper,
        ServerStateWrapper,
        ClientStateWrapper(contexts.clientState),
        InfraWrapper(contexts.infraContext),
      )(children),
  });
}

function ContextWrapper(
  layers: Layer[],
  contexts: {
    clientState?: PreloadedState<RootState>;
    infraContext?: Partial<InfraContextValue>;
    routes?: RouteObject[];
  } = {},
) {
  return ({ children }: PropsWithChildren) => {
    let element = children;

    if (includes('Routes', layers)) element = RoutesWrapper(contexts.routes)(element);
    if (includes('Style', layers)) element = StyleWrapper(element);
    if (includes('ServerState', layers)) element = ServerStateWrapper(element);
    if (includes('ClientState', layers)) element = ClientStateWrapper(contexts.clientState)(element);
    if (includes('Infra', layers)) element = InfraWrapper(contexts.infraContext)(element);

    return <>{element}</>;
  };
}

function InfraWrapper(infraContext?: Partial<InfraContextValue>) {
  return (ui: ReactNode) => <InfraProvider init={infraContext}>{ui}</InfraProvider>;
}
function ClientStateWrapper(state?: PreloadedState<RootState>) {
  return (ui: ReactNode) => <Provider store={setupStore(state)}>{ui}</Provider>;
}
function ServerStateWrapper(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 2, retryDelay: 10 } },
    logger: { log: () => undefined, warn: () => undefined, error: () => undefined },
  });
  return <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>;
}
function StyleWrapper(ui: ReactNode) {
  return <StyleProvider rootElem={document.body}>{ui}</StyleProvider>;
}
function RoutesWrapper(routes: RouteObject[] = []) {
  return (ui: ReactNode) => {
    const options = { element: ui, path: '/' };
    const router = createMemoryRouter([options, ...routes], {
      initialEntries: [options.path],
      initialIndex: 1,
    });
    return <RouterProvider router={router} />;
  };
}

export function cleanupDocument() {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
}

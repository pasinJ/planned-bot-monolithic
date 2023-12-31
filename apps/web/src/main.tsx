import * as React from 'react';
import { createRoot } from 'react-dom/client';

import LocalizationDateProvider from '#components/LocalizationDateProvider';
import Toaster from '#components/Toaster';
import InfraProvider from '#infra/InfraProvider.context';
import RoutesProvider from '#routes/RoutesProvider';
import ClientStateProvider from '#state/ClientStateProvider.context';
import ServerStateProvider from '#state/ServerStateProvider.context';
import StyleProvider from '#styles/containers/StyleProvider';

import reportAccessibility from './accessibility';

void (async () => {
  if (import.meta.env.DEV) await reportAccessibility(React);
  if (import.meta.env.MODE === 'standalone') {
    const { worker } = await import('../mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
})();

const rootElement = document.getElementById('root') ?? createNewRootElementInBody();
createRoot(rootElement).render(
  <React.StrictMode>
    <InfraProvider>
      <ClientStateProvider>
        <ServerStateProvider>
          <StyleProvider rootElem={rootElement}>
            <LocalizationDateProvider>
              <RoutesProvider />
            </LocalizationDateProvider>
            <Toaster />
          </StyleProvider>
        </ServerStateProvider>
      </ClientStateProvider>
    </InfraProvider>
  </React.StrictMode>,
);

function createNewRootElementInBody() {
  const rootElement = document.createElement('div');
  Object.assign(rootElement, { id: 'root' });
  document.body.appendChild(rootElement);

  return rootElement;
}

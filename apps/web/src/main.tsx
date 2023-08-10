import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import InfraProvider from '#contexts/InfraProvider';
import StateProvider from '#contexts/StateProvider';
import RoutesProvider from '#routes/RoutesProvider';
import StyleProvider from '#styles/containers/StyleProvider';

const rootElement = document.getElementById('root') ?? createNewRootElementInBody();

createRoot(rootElement).render(
  <StrictMode>
    <InfraProvider>
      <StyleProvider rootElem={rootElement}>
        <StateProvider>
          <RoutesProvider />
        </StateProvider>
      </StyleProvider>
    </InfraProvider>
  </StrictMode>,
);

function createNewRootElementInBody() {
  const rootElement = document.createElement('div');
  Object.assign(rootElement, { id: 'root' });
  document.body.appendChild(rootElement);

  return rootElement;
}

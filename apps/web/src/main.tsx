import * as React from 'react';
import { createRoot } from 'react-dom/client';

import InfraProvider from '#contexts/InfraProvider';
import StateProvider from '#contexts/StateProvider';
import RoutesProvider from '#routes/RoutesProvider';
import StyleProvider from '#styles/containers/StyleProvider';
import reportAccessibility from '#utils/reportAccessibility';

const rootElement = document.getElementById('root') ?? createNewRootElementInBody();
createRoot(rootElement).render(
  <React.StrictMode>
    <InfraProvider>
      <StyleProvider rootElem={rootElement}>
        <StateProvider>
          <RoutesProvider />
        </StateProvider>
      </StyleProvider>
    </InfraProvider>
  </React.StrictMode>,
);

if (process.env.NODE_ENV !== 'production') await reportAccessibility(React);

function createNewRootElementInBody() {
  const rootElement = document.createElement('div');
  Object.assign(rootElement, { id: 'root' });
  document.body.appendChild(rootElement);

  return rootElement;
}

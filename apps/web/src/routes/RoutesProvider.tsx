import { PropsWithChildren, createContext } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';

import LazyWrapper from '#components/LazyWrapper';

import { HOME_ROUTE } from './routes.constant';

const HomePage = () => import('#pages/HomePage');

export default function RoutesProvider({ children }: PropsWithChildren) {
  return (
    <BrowserRouter>
      <RoutingProvider>
        <Routes>
          <Route element={<LazyWrapper component={HomePage} />} path={HOME_ROUTE} />
          <Route element={<>Empty</>} path="*" />
        </Routes>
        {children}
      </RoutingProvider>
    </BrowserRouter>
  );
}

const RoutingContext = createContext({});

function RoutingProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const routingState = { navigateToHome: () => navigate(HOME_ROUTE) };

  return <RoutingContext.Provider value={routingState}>{children}</RoutingContext.Provider>;
}

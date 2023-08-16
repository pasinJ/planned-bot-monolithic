import { useNavigate } from 'react-router-dom';

import { DASHBOARD_ROUTE, HOME_ROUTE } from './routes.constant';

export default function useNavigateTo() {
  const navigate = useNavigate();
  return {
    navigateToHome: () => navigate(HOME_ROUTE),
    navigateToDashboard: () => navigate(DASHBOARD_ROUTE),
  };
}

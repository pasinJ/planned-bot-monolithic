import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

import useAppTheme from '#styles/hooks/useAppTheme';

export default function Toaster() {
  const { appTheme } = useAppTheme();
  return <ToastContainer theme={appTheme} />;
}

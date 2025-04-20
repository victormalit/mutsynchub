// src/routes/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import Home from '../pages/Home';
import Solutions from '../pages/Solutions';
import SaaS from '../pages/SaaS';
import Resources from '../pages/Resources';
import Support from '../pages/Support';
export default createBrowserRouter([
  {
    path: '/',
    element: <App />, // This must use the component with Outlet
    children: [
      { index: true, element: <Home /> },
      { path: 'home', element: <Home /> },
      { path: 'solutions', element: <Solutions /> },
      { path: 'saas', element: <SaaS /> },
      { path: 'resources', element: <Resources /> },
      { path: 'support', element: <Support /> },
    ],
  },
]);
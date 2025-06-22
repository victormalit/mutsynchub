// src/routes/index.tsx


import React from 'react';
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import App from '../App';
import SolutionsWithSidebar from '../pages/Solutions';
import Resources from '../pages/Resources';
import Home from '../pages/Home';
import Support from '../pages/Support';
import AnalyticsEngineDashboard from '../pages/AdminDashboard';
import AnalyticsDashboardLanding from '../pages/AnalyticsDashboardLanding';
import AuditLogs from '../components/admin/AuditLogs';
import Revenue from '../components/admin/Revenue';
import UsersOrgs from '../components/admin/UsersOrgs';
import Analytics from '../components/admin/Analytics';
import Settings from '../components/admin/Settings';




const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'home', element: <Home /> },
      { path: 'solutions', element: <SolutionsWithSidebar /> },
      { path: 'resources', element: <Resources /> },
      { path: 'support', element: <Support /> },
    ],
  },
  {
    path: '/analytics',
    element: <AnalyticsEngineDashboard />,
    children: [
      { index: true, element: <AnalyticsDashboardLanding /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'audit-logs', element: <AuditLogs /> },
      { path: 'revenue', element: <Revenue /> },
      { path: 'users', element: <UsersOrgs /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
];


export default createBrowserRouter(routes);
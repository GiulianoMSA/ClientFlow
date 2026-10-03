import {
  createBrowserRouter,
  Navigate,
} from 'react-router';

import Login from '../pages/login';
import Dashboard from '../pages/dashboard';
import Clients from '../pages/clients';
import Tasks from '../pages/tasks';
import Activities from '../pages/activities';
import AppLayout from '../layouts/AppLayout';

import ProtectedRoute from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Navigate
        to="/dashboard"
        replace
      />
    ),
  },

  {
    path: '/login',
    element: <Login />,
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/dashboard',
            element: <Dashboard />,
          },

          {
            path: '/clients',
            element: <Clients />,
          },

          { path: '/tasks',
            element: <Tasks /> 
          },

          { path: '/activities', 
            element: <Activities /> 
          },
        ],
      },
    ],
  },
]);
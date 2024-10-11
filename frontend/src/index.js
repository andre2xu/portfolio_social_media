import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// stylesheets
import './index.css';

// views
import LoginPage from './views/LoginPage';
import SignUpPage from './views/SignUpPage';
import ProtectedRoutes from './components/ProtectedRoutes';



const ROUTER = createBrowserRouter([
  {
    path: '/',
    element: <h1>Home Page</h1>
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/signup',
    element: <SignUpPage />
  },
  {
    element: <ProtectedRoutes />,
    children: [
      {
        path: '/account',
        element: <h1>My account</h1>
      }
    ]
  }
]);

const ROOT = ReactDOM.createRoot(document.getElementById('root'));

ROOT.render(
  <RouterProvider router={ROUTER} />
);

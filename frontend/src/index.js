import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// stylesheets
import './index.css';

// views
import LoginPage from './views/LoginPage';



const ROUTER = createBrowserRouter([
  {
    path: '/',
    element: <h1>Home Page</h1>
  },
  {
    path: '/login',
    element: <LoginPage />
  }
]);

const ROOT = ReactDOM.createRoot(document.getElementById('root'));

ROOT.render(
  <RouterProvider router={ROUTER} />
);

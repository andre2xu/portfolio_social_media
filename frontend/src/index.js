import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// stylesheets
import './index.css';

// general views
import LoginPage from './views/LoginPage';
import SignUpPage from './views/SignUpPage';
import ProtectedRoutes from './components/ProtectedRoutes';
import MainScreen from './views/MainScreen';

// main screen views
import ExplorePage from './views/ExplorePage';
import AccountPage from './views/AccountPage';
import ProfilePage from './views/ProfilePage';
import MessagesPage from './views/MessagesPage';
import NotificationsPage from './views/NotificationsPage';
import CommentsScreen from './views/CommentsScreen';
import ChatScreen from './views/ChatScreen';



const ROUTER = createBrowserRouter([
  {
    path: '/',
    element: <MainScreen component={<ExplorePage />} />
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
    path: '/profile/:username',
    element: <MainScreen component={<ProfilePage />} />
  },
  {
    element: <ProtectedRoutes />,
    children: [
      {
        path: '/account',
        element: <MainScreen component={<AccountPage />} />
      },
      {
        path: '/account/messages',
        element: <MainScreen component={<MessagesPage />} />
      },
      {
        path: '/chat/:cid',
        element: <MainScreen component={<ChatScreen />} />
      },
      {
        path: '/account/notifications',
        element: <MainScreen component={<NotificationsPage />} />
      },
      {
        path: '/post/:pid',
        element: <MainScreen component={<CommentsScreen />} />
      }
    ]
  }
]);

const ROOT = ReactDOM.createRoot(document.getElementById('root'));

ROOT.render(
  <RouterProvider router={ROUTER} />
);

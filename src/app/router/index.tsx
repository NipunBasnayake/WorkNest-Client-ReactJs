import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { PublicLayout } from '@/app/layouts/PublicLayout'
import { LandingPage } from '@/pages/public/LandingPage'
import { LoginPage } from '@/pages/public/LoginPage'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { RegisterCompanyPage } from '@/pages/public/RegisterCompanyPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register-company', element: <RegisterCompanyPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}

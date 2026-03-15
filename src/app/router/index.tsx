import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PublicLayout } from "@/app/layouts/PublicLayout";
import { LandingPage } from "@/pages/public/LandingPage";
import { LoginPage } from "@/pages/public/LoginPage";
import { RegisterCompanyPage } from "@/pages/public/RegisterCompanyPage";
import { NotFoundPage } from "@/pages/public/NotFoundPage";

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterCompanyPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

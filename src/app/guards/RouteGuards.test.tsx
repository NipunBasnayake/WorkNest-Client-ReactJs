import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { AnnouncementManageGuard, PermissionGuard, PlatformGuard, TenantGuard } from "@/app/guards/RouteGuards";
import { PERMISSIONS } from "@/constants/permissions";
import { useAuthStore } from "@/store/authStore";

function renderWithRoutes(element: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={element}>
          <Route index element={<div>Protected Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  useAuthStore.setState({
    isAuthenticated: false,
    sessionType: null,
    tenantKey: null,
    user: null,
    isBootstrapping: false,
    isLoading: false,
    error: null,
  });
});

describe("Route guards", () => {
  it("redirects unauthenticated tenant route access to login", () => {
    renderWithRoutes(<TenantGuard />);
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("allows tenant access when authenticated tenant session exists", () => {
    useAuthStore.setState({
      isAuthenticated: true,
      sessionType: "tenant",
      user: { id: "1", name: "Tenant User", email: "tenant@worknest.test", role: "EMPLOYEE", tenantKey: "acme" },
    });

    renderWithRoutes(<TenantGuard />);
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("allows tenant admins through permission-protected modules", () => {
    useAuthStore.setState({
      isAuthenticated: true,
      sessionType: "tenant",
      user: { id: "2", name: "Tenant Admin", email: "admin@worknest.test", role: "TENANT_ADMIN", tenantKey: "acme" },
    });

    renderWithRoutes(<PermissionGuard permission={PERMISSIONS.EMPLOYEES_MANAGE} />);
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("blocks legacy managers from announcement management routes", () => {
    useAuthStore.setState({
      isAuthenticated: true,
      sessionType: "tenant",
      user: { id: "4", name: "Manager User", email: "manager@worknest.test", role: "MANAGER", tenantKey: "acme" },
    });

    renderWithRoutes(<AnnouncementManageGuard />);
    expect(screen.getByText("Unauthorized Page")).toBeInTheDocument();
  });

  it("allows HR users through announcement management routes", () => {
    useAuthStore.setState({
      isAuthenticated: true,
      sessionType: "tenant",
      user: { id: "5", name: "HR User", email: "hr@worknest.test", role: "HR", tenantKey: "acme" },
    });

    renderWithRoutes(<AnnouncementManageGuard />);
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("blocks tenant sessions from platform routes", () => {
    useAuthStore.setState({
      isAuthenticated: true,
      sessionType: "tenant",
      user: { id: "3", name: "Tenant User", email: "tenant@worknest.test", role: "EMPLOYEE", tenantKey: "acme" },
    });

    renderWithRoutes(<PlatformGuard />);
    expect(screen.getByText("Unauthorized Page")).toBeInTheDocument();
  });
});

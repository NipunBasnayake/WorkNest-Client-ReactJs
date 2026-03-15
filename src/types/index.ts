/* ──────────────────────────────────────────
   Public / Landing types (Phase 1)
   ────────────────────────────────────────── */

export interface NavLink {
  label: string;
  href: string;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface Step {
  number: string;
  title: string;
  description: string;
}

export interface RoleBenefit {
  role: string;
  description: string;
  highlights: string[];
}

/* ──────────────────────────────────────────
   Auth types (Phase 2)
   ────────────────────────────────────────── */

/** Platform-side roles */
export type PlatformRole = "PLATFORM_ADMIN" | "PLATFORM_USER";

/** Tenant-side roles */
export type TenantRole = "ADMIN" | "MANAGER" | "HR" | "EMPLOYEE";

export type UserRole = PlatformRole | TenantRole;

/** Identifies which "area" of the application the session belongs to */
export type SessionType = "platform" | "tenant";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantKey?: string | null;
  /** Derived from role/tenantKey */
  sessionType: SessionType;
}

export interface LoginPayload {
  email: string;
  password: string;
  tenantKey: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user?: AuthUser;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/* ──────────────────────────────────────────
   Platform types (Phase 2)
   ────────────────────────────────────────── */

export interface Tenant {
  id: string;
  tenantKey: string;
  companyName: string;
  adminEmail?: string;
  status?: "active" | "inactive" | "suspended";
  createdAt?: string;
  [key: string]: unknown;
}

/* ──────────────────────────────────────────
   Employee types (Phase 2)
   ────────────────────────────────────────── */

export interface Employee {
  id: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  position?: string;
  department?: string;
  role?: TenantRole | string;
  phone?: string;
  salary?: number | string;
  status?: "active" | "inactive";
  joinedAt?: string;
  [key: string]: unknown;
}

export interface EmployeeListResponse {
  employees: Employee[];
  total?: number;
  page?: number;
}

/* ──────────────────────────────────────────
   UI / Navigation types (Phase 2)
   ────────────────────────────────────────── */

export interface SidebarNavItem {
  label: string;
  path: string;
  icon: string;
  /** Lucide icon name */
  roles?: UserRole[];
  badge?: string | number;
  children?: SidebarNavItem[];
}

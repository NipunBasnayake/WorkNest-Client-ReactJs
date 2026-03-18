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

export type PlatformRole = "PLATFORM_ADMIN" | "PLATFORM_USER";
export type TenantRole = "TENANT_ADMIN" | "ADMIN" | "MANAGER" | "HR" | "EMPLOYEE";
export type UserRole = PlatformRole | TenantRole;
export type SessionType = "platform" | "tenant";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  tenantKey?: string | null;
  sessionType?: SessionType;
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
  timestamp?: string;
  errorCode?: string;
  path?: string;
}

export interface Tenant {
  id: string;
  tenantKey: string;
  companyName: string;
  adminEmail?: string;
  status?: "active" | "inactive" | "suspended" | string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface TenantOnboardingRequest {
  companyName: string;
  tenantKey: string;
  adminFullName: string;
  adminEmail: string;
  adminPassword: string;
}

export type TenantProvisioningStatus = "PROVISIONING" | "ACTIVE" | "FAILED" | string;

export interface TenantProvisioningData {
  tenantId: number;
  tenantKey: string;
  companyName: string;
  databaseName: string;
  status: TenantProvisioningStatus;
  tenantAdminUserId: number;
  tenantAdminEmail: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  employeeCode?: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  position?: string;
  designation?: string;
  department?: string;
  role?: TenantRole | string;
  phone?: string;
  salary?: number | string;
  status?: "ACTIVE" | "INACTIVE" | "active" | "inactive" | string;
  joinedAt?: string;
  joinedDate?: string;
  [key: string]: unknown;
}

export interface EmployeeListResponse {
  employees: Employee[];
  total?: number;
  page?: number;
}

export interface SidebarNavItem {
  label: string;
  path: string;
  icon: string;
  roles?: Array<UserRole | string>;
  badge?: string | number;
  children?: SidebarNavItem[];
}

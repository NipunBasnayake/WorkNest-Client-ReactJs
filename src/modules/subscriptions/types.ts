export type SubscriptionStatus = "ACTIVE" | "INACTIVE" | "EXPIRED" | "PLAN_DISABLED";

export interface SubscriptionPlan {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  billingPeriod: string;
  badge?: string | null;
  recommended: boolean;
  color?: string | null;
  icon?: string | null;
  active: boolean;
  displayOrder: number;
  enabledFeatureCount: number;
  totalFeatureCount: number;
  tenantCount: number;
}

export interface SubscriptionPlanInput {
  name: string;
  code: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  billingPeriod: string;
  badge?: string;
  recommended: boolean;
  color: string;
  icon: string;
  active: boolean;
  displayOrder: number;
}

export interface TenantSubscription {
  id: number;
  tenantId: number;
  tenantKey: string;
  tenantName: string;
  planId: number;
  planName: string;
  planCode: string;
  assignedDate: string;
  expiresAt?: string | null;
  active: boolean;
  status: SubscriptionStatus;
}

export interface FeatureMatrixRow {
  featureId: number;
  featureKey: string;
  displayName: string;
  plans: Record<string, boolean>;
}

export interface FeatureMatrix {
  plans: SubscriptionPlan[];
  features: FeatureMatrixRow[];
}

export interface SubscriptionStatistics {
  totalPackages: number;
  activePackages: number;
  totalTenants: number;
  subscribedTenants: number;
  planDistribution: Record<string, number>;
  mostPopularPackage?: string | null;
  recentlyUpgraded: number;
  recentlyExpired: number;
}

export interface SubscriptionOverview {
  statistics: SubscriptionStatistics;
  plans: SubscriptionPlan[];
  tenantSubscriptions: TenantSubscription[];
  featureMatrix: FeatureMatrix;
}

export interface TenantPlanAssignmentInput {
  planCode: string;
  expiresAt?: string | null;
}

export interface CurrentSubscriptionAccess {
  planName: string;
  planCode: string;
  assignedDate: string;
  expiresAt?: string | null;
  active: boolean;
  status: SubscriptionStatus;
  features: string[];
}

export interface TenantPackageCatalog {
  currentSubscription: CurrentSubscriptionAccess;
  plans: SubscriptionPlan[];
  featureMatrix: FeatureMatrix;
}

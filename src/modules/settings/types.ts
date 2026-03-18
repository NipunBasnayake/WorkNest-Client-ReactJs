export type ThemePreference = "system" | "light" | "dark";

export interface ProfileSettings {
  fullName: string;
  email: string;
  title: string;
}

export interface WorkspaceSettings {
  workspaceName: string;
  tenantKey: string;
  status: string;
  createdAt: string;
  databaseName?: string;
  dataSource: "backend" | "inferred";
}

export interface PreferenceSettings {
  theme: ThemePreference;
  emailNotifications: boolean;
  pushNotifications: boolean;
  dailyDigest: boolean;
}

export interface TenantSettingsBundle {
  profile: ProfileSettings;
  workspace: WorkspaceSettings;
  preferences: PreferenceSettings;
}

export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  auditLogsRetentionDays: number;
}

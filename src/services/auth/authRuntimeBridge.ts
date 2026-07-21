export interface AuthRuntimeAdapter {
  getTenantKey: () => string | null;
  applyTokenRefresh: (accessToken: string, tenantKey: string | null) => void;
  hardLogout: (redirectTo?: string) => void;
}

let adapter: AuthRuntimeAdapter | null = null;

export function registerAuthRuntimeAdapter(nextAdapter: AuthRuntimeAdapter): () => void {
  adapter = nextAdapter;
  return () => {
    if (adapter === nextAdapter) adapter = null;
  };
}

export function getAuthRuntimeAdapter(): AuthRuntimeAdapter | null {
  return adapter;
}

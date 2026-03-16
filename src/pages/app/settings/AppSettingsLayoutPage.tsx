import { NavLink, Outlet } from "react-router-dom";
import { Building2, SlidersHorizontal, UserCircle2 } from "lucide-react";

const SETTINGS_SECTIONS = [
  { label: "Profile", to: "/app/settings/profile", icon: <UserCircle2 size={16} /> },
  { label: "Workspace", to: "/app/settings/workspace", icon: <Building2 size={16} /> },
  { label: "Preferences", to: "/app/settings/preferences", icon: <SlidersHorizontal size={16} /> },
];

export function AppSettingsLayoutPage() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
      <aside className="rounded-2xl border p-3" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
        <nav className="space-y-2">
          {SETTINGS_SECTIONS.map((section) => (
            <NavLink
              key={section.to}
              to={section.to}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium no-underline transition-colors"
              style={({ isActive }) => ({
                backgroundColor: isActive ? "rgba(147,50,234,0.12)" : "transparent",
                color: isActive ? "var(--color-primary-600)" : "var(--text-secondary)",
              })}
            >
              {section.icon}
              {section.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div>
        <Outlet />
      </div>
    </div>
  );
}

/**
 * Centralised asset exports.
 *
 * Import assets through this module instead of scattering raw imports
 * throughout the codebase. This makes it easy to swap assets, add
 * lazy loading, or migrate to a CDN later.
 *
 * Usage:
 *   import { WORKNEST_LOGO, PLACEHOLDER_AVATAR } from "@/assets";
 *
 *   <img src={WORKNEST_LOGO} alt="WorkNest" />
 */

/* ── Images ── */

// Re-export any static images placed in assets/images/
// Example:
// export { default as WORKNEST_LOGO } from "./images/worknest-logo.png";

/* ── Placeholders ── */

export const PLACEHOLDER_AVATAR = undefined as string | undefined;
export const PLACEHOLDER_IMAGE = undefined as string | undefined;
export const PLACEHOLDER_DOCUMENT = undefined as string | undefined;

/* ── Icons (static SVGs not covered by lucide-react) ── */

// Export custom SVGs here if needed:
// export { default as CustomIcon } from "./icons/custom-icon.svg";

/* ── Helper: build a placeholder avatar URL from initials ── */

/**
 * Returns a data-URI avatar from the given name initials.
 * Falls back to `undefined` when the canvas API is unavailable.
 */
export function getInitialsAvatar(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;

  const initials = name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  if (!initials) return undefined;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    // Generate a stable background colour from the name
    const hue = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
    ctx.fillStyle = `hsl(${hue}, 45%, 55%)`;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, 32, 32);

    return canvas.toDataURL("image/png");
  } catch {
    return undefined;
  }
}

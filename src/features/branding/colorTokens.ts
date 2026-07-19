import { WORKNEST_PRIMARY_COLOR } from "@/features/branding/types";

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const HEX_COLOR = /^#[0-9A-F]{6}$/;

function parseHex(value: string): Rgb {
  const normalized = normalizeBrandColor(value);
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function channel(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(color: Rgb): number {
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

function contrast(left: Rgb, right: Rgb): number {
  const light = Math.max(luminance(left), luminance(right));
  const dark = Math.min(luminance(left), luminance(right));
  return (light + 0.05) / (dark + 0.05);
}

function mix(source: Rgb, target: Rgb, targetWeight: number): Rgb {
  const sourceWeight = 1 - targetWeight;
  return {
    r: Math.round(source.r * sourceWeight + target.r * targetWeight),
    g: Math.round(source.g * sourceWeight + target.g * targetWeight),
    b: Math.round(source.b * sourceWeight + target.b * targetWeight),
  };
}

function toHex(color: Rgb): string {
  const value = (channelValue: number) => Math.max(0, Math.min(255, channelValue)).toString(16).padStart(2, "0");
  return `#${value(color.r)}${value(color.g)}${value(color.b)}`.toUpperCase();
}

function accessibleAction(source: Rgb): { background: Rgb; foreground: string } {
  const white = { r: 255, g: 255, b: 255 };
  const ink = { r: 17, g: 24, b: 39 };
  if (contrast(source, white) >= 4.5) return { background: source, foreground: "#FFFFFF" };
  if (contrast(source, ink) >= 4.5) return { background: source, foreground: "#111827" };

  for (let weight = 0.08; weight <= 0.72; weight += 0.04) {
    const darker = mix(source, { r: 0, g: 0, b: 0 }, weight);
    if (contrast(darker, white) >= 4.5) return { background: darker, foreground: "#FFFFFF" };
  }
  return { background: { r: 67, g: 18, b: 114 }, foreground: "#FFFFFF" };
}

export function normalizeBrandColor(value?: string | null): string {
  const normalized = value?.trim().toUpperCase() ?? "";
  return HEX_COLOR.test(normalized) ? normalized : WORKNEST_PRIMARY_COLOR;
}

export function isValidBrandColor(value: string): boolean {
  return HEX_COLOR.test(value.trim().toUpperCase());
}

export function hasAccessibleTextContrast(background: string): boolean {
  const color = parseHex(background);
  return Math.max(
    contrast(color, { r: 255, g: 255, b: 255 }),
    contrast(color, { r: 17, g: 24, b: 39 })
  ) >= 4.5;
}

export function deriveBrandTokens(primaryColor?: string | null): Record<string, string> {
  const source = parseHex(primaryColor ?? WORKNEST_PRIMARY_COLOR);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };
  const action = accessibleAction(source);
  const actionHover = mix(action.background, black, 0.12);
  const actionActive = mix(action.background, black, 0.22);

  return {
    "--tenant-primary": toHex(source),
    "--color-primary-50": toHex(mix(source, white, 0.94)),
    "--color-primary-100": toHex(mix(source, white, 0.86)),
    "--color-primary-200": toHex(mix(source, white, 0.70)),
    "--color-primary-300": toHex(mix(source, white, 0.50)),
    "--color-primary-400": toHex(mix(source, white, 0.25)),
    "--color-primary-500": toHex(source),
    "--color-primary-600": toHex(action.background),
    "--color-primary-700": toHex(actionHover),
    "--color-primary-800": toHex(mix(source, black, 0.36)),
    "--color-primary-900": toHex(mix(source, black, 0.52)),
    "--color-primary-950": toHex(mix(source, black, 0.68)),
    "--brand-action": toHex(action.background),
    "--brand-action-hover": toHex(actionHover),
    "--brand-action-active": toHex(actionActive),
    "--brand-on-primary": action.foreground,
    "--brand-soft": toHex(mix(source, white, 0.90)),
    "--brand-border": toHex(mix(source, white, 0.58)),
    "--brand-focus": toHex(action.background),
    "--primary-soft": `color-mix(in srgb, ${toHex(source)} 10%, transparent)`,
    "--glow-primary": `color-mix(in srgb, ${toHex(source)} 18%, transparent)`,
    "--glow-subtle": `color-mix(in srgb, ${toHex(source)} 8%, transparent)`,
  };
}

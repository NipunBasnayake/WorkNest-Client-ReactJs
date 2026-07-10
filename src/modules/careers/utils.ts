import type { PublicEmploymentType } from "@/modules/careers/types";

const employmentTypeLabels: Record<PublicEmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERN: "Internship",
  REMOTE: "Remote",
  HYBRID: "Hybrid",
};

export function formatEmploymentType(type?: PublicEmploymentType) {
  return type ? employmentTypeLabels[type] ?? type.replaceAll("_", " ") : "Not specified";
}

export function formatPublicDate(value?: string) {
  if (!value) return "Not specified";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function splitRichText(value?: string) {
  if (!value) return [];
  return value
    .split(/\r?\n|•|-/)
    .map((item) => item.trim())
    .filter(Boolean);
}

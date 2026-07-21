export const MAX_EMPLOYEE_SKILLS = 10;

export function normalizeSkillName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase()
    .replace(/(^|\s)(\S)/g, (_match, prefix: string, character: string) => (
      `${prefix}${character.toLocaleUpperCase()}`
    ));
}

export function getSkillKey(value: string): string {
  return normalizeSkillName(value).toLocaleLowerCase();
}

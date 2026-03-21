export function validatePasswordStrength(password: string): string | null {
  const value = password.trim();

  if (!value) return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "Password must include at least one letter and one number.";
  }

  return null;
}

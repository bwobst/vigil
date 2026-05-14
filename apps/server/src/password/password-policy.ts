export interface PolicyResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PolicyResult {
  const errors: string[] = [];
  if (password.length < 12) {
    errors.push("at least 12 characters required");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("at least one uppercase letter required");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("at least one lowercase letter required");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("at least one digit required");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("at least one symbol required");
  }
  return { valid: errors.length === 0, errors };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

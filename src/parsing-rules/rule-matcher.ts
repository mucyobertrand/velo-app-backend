/**
 * Mirrors how the app runs a rule: case-insensitive, named groups.
 * Returns the captured fields (absent optional groups removed), or null.
 */
export function matchRule(
  pattern: string,
  message: string,
): Record<string, string> | null {
  const match = new RegExp(pattern, 'i').exec(message.trim());
  if (!match) return null;
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(match.groups ?? {})) {
    if (value !== undefined) fields[key] = value;
  }
  return fields;
}

/** Returns an error message if the pattern is unusable, otherwise null. */
export function checkPattern(pattern: string, sample?: string | null) {
  try {
    new RegExp(pattern, 'i');
  } catch {
    return 'pattern is not a valid regular expression';
  }
  if (sample && !matchRule(pattern, sample)) {
    return 'pattern does not match its sample message';
  }
  return null;
}

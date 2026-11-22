import { parsePhoneNumberFromString } from 'libphonenumber-js/max';

/** No country guessing, extensions or extraction from arbitrary text. Not ownership proof. */
export function normalizePhone(value: string): string | null {
  const input = value.trim();
  if (!input || input.length > 64 || !/^\+[0-9 ()-]+$/.test(input)) return null;
  const compact = input.replace(/[ ()-]/g, '');
  if (!/^\+[1-9][0-9]{1,14}$/.test(compact)) return null;
  const parsed = parsePhoneNumberFromString(compact, { extract: false });
  return parsed?.isValid() && !parsed.ext && parsed.number === compact ? parsed.number : null;
}

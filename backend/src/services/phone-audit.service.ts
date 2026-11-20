import { normalizePhone } from '../utils/phone';

/** Aggregate-only report: do not print phone numbers, names or account identifiers. */
export function auditPhoneValues(values: Array<string | null>) {
  let blank = 0, invalidOrAmbiguous = 0, formatted = 0;
  const owners = new Map<string, number>();
  for (const value of values) {
    if (value === null || !value.trim()) { blank++; continue; }
    const phone = normalizePhone(value);
    if (!phone) { invalidOrAmbiguous++; continue; }
    if (phone !== value) formatted++;
    owners.set(phone, (owners.get(phone) ?? 0) + 1);
  }
  const collisions = [...owners.values()].filter((count) => count > 1);
  return {
    total: values.length,
    blank,
    invalidOrAmbiguous,
    formatted,
    canonicalCollisionGroups: collisions.length,
    accountsInCollisionGroups: collisions.reduce((total, count) => total + count, 0),
  };
}

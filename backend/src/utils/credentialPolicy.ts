/** Bcrypt accepts at most 72 bytes; provisioning has no shared/default password. */
export function isSafeProvisioningPassword(password: string): boolean {
  return (
    Buffer.byteLength(password) >= 12 &&
    Buffer.byteLength(password) <= 72 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    !/adminpass123!|change.?me|replace|example|fallback/i.test(password)
  );
}

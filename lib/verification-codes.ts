// Shared verification codes storage
// Using globalThis to ensure it persists across API route instances
declare global {
  var __verificationCodes: Map<string, { code: string; expiresAt: number }> | undefined;
}

if (!globalThis.__verificationCodes) {
  globalThis.__verificationCodes = new Map<string, { code: string; expiresAt: number }>();
}

export const verificationCodes = globalThis.__verificationCodes;

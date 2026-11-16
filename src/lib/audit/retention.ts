export const AUDIT_RETENTION_DAYS = 30;

export const auditExpiry = (now = Date.now()) =>
  new Date(now - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

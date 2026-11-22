export const AUDIT_ACTIONS = ["create", "update", "delete", "restore", "import"] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditChange = { column: string; from: unknown; to: unknown };

export const AUDIT_RECORD_IDS_LIMIT = 1000;
export const AUDIT_CHANGES_LIMIT = 50;
export const AUDIT_VALUE_LIMIT = 200;

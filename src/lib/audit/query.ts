import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

import { createSearchValidator } from "../search-params";
import { AUDIT_ACTIONS } from "./actions";

export const AUDIT_PAGE_SIZES = [10, 20, 50, 100] as const;

export const auditSearchParams = {
  pageSize: parseAsNumberLiteral(AUDIT_PAGE_SIZES).withDefault(20),
  table: parseAsInteger,
  action: parseAsStringLiteral(AUDIT_ACTIONS),
  cursor: parseAsString,
  dir: parseAsStringLiteral(["next", "prev"] as const).withDefault("next"),
};

export type AuditQuery = inferParserType<typeof auditSearchParams>;

export const auditSearchSchema = createStandardSchemaV1(auditSearchParams, {
  partialOutput: true,
});

export const resolveAuditQuery = (search: Partial<AuditQuery>): AuditQuery => ({
  pageSize: search.pageSize ?? auditSearchParams.pageSize.defaultValue,
  table: search.table ?? null,
  action: search.action ?? null,
  cursor: search.cursor ?? null,
  dir: search.dir ?? auditSearchParams.dir.defaultValue,
});

export const validateAuditSearch = createSearchValidator(auditSearchParams);

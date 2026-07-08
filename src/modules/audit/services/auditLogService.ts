import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList, getNumber, getString, toIsoDateTime } from "@/services/http/parsers";

export type AuditActionType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "PROVISION"
  | "ASSIGN"
  | "APPROVE"
  | "REJECT"
  | "CANCEL"
  | "SEND_MESSAGE"
  | "MARK_READ"
  | "UPLOAD"
  | "DOWNLOAD"
  | "SHORTLIST"
  | "SCHEDULE"
  | "SUBMIT_FEEDBACK"
  | "LOGIN";

export type AuditEntityType =
  | "EMPLOYEE"
  | "TEAM"
  | "PROJECT"
  | "TASK"
  | "LEAVE_REQUEST"
  | "ANNOUNCEMENT"
  | "ATTACHMENT"
  | "JOB_POSITION"
  | "CANDIDATE"
  | "CANDIDATE_APPLICATION"
  | "CANDIDATE_COMMENT"
  | "INTERVIEW"
  | "INTERVIEW_FEEDBACK"
  | "HR_MESSAGE"
  | "TEAM_CHAT"
  | "TEAM_CHAT_MESSAGE"
  | "NOTIFICATION";

export interface AuditLog {
  id: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  action: AuditActionType | string;
  entityType: AuditEntityType | string;
  entityId?: string;
  metadataJson?: string;
  createdAt: string;
}

export interface AuditLogQuery {
  action?: string;
  entityType?: string;
  actorId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export interface AuditLogPage {
  items: AuditLog[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

function toAuditLog(input: unknown): AuditLog {
  const record = asRecord(input);
  const actor = asRecord(record.actor);
  const id = getString(record.id) ?? "0";

  return {
    id,
    actorId: getString(actor.id),
    actorName: getString(actor.fullName),
    actorEmail: getString(record.actorEmail) ?? getString(actor.email),
    action: getString(record.action) ?? "UPDATE",
    entityType: getString(record.entityType) ?? "TASK",
    entityId: getString(record.entityId),
    metadataJson: getString(record.metadataJson),
    createdAt: toIsoDateTime(record.createdAt),
  };
}

export async function getAuditLogs(query: AuditLogQuery = {}): Promise<AuditLogPage> {
  const params: Record<string, string | number> = {
    page: query.page ?? 0,
    size: query.size ?? 20,
    sortBy: "createdAt",
    sortDir: "desc",
  };

  if (query.action) params.action = query.action;
  if (query.entityType) params.entityType = query.entityType;
  if (query.actorId) params.actorId = query.actorId;
  if (query.fromDate) params.fromDate = `${query.fromDate}T00:00:00`;
  if (query.toDate) params.toDate = `${query.toDate}T23:59:59`;

  const { data } = await apiClient.get("/api/tenant/audit-logs/paged", { params });
  const payload = asRecord(unwrapApiData<unknown>(data));

  return {
    items: extractList(payload).map(toAuditLog),
    page: getNumber(payload.page) ?? query.page ?? 0,
    size: getNumber(payload.size) ?? query.size ?? 20,
    totalElements: getNumber(payload.totalElements) ?? 0,
    totalPages: getNumber(payload.totalPages) ?? 0,
  };
}

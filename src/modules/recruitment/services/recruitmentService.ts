import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList, firstDefined, getId, getNumber, getString, toIsoDateTime } from "@/services/http/parsers";
import type { ApiResponse, Employee } from "@/types";
import type {
  PaginatedResult,
  RecruitmentApplication,
  RecruitmentApplicationEvent,
  RecruitmentCandidate,
  RecruitmentCandidateComment,
  RecruitmentEmailLog,
  RecruitmentEmailTemplate,
  RecruitmentEmailTemplateType,
  RecruitmentHireFormValues,
  RecruitmentHireResponse,
  RecruitmentInterview,
  RecruitmentInterviewFormValues,
  RecruitmentJobFormValues,
  RecruitmentJobPosition,
  RecruitmentStage,
} from "@/modules/recruitment/types";

type ListParams = { search?: string; page?: number; size?: number; sortBy?: string; sortDir?: "asc" | "desc" };
export type ApplicationListParams = ListParams & { status?: RecruitmentStage | ""; jobPositionId?: string };

function bool(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  return typeof value === "string" ? value.toLowerCase() === "true" : fallback;
}

function employeeSummary(value: unknown) {
  const record = asRecord(value);
  return {
    id: getId(firstDefined(record.id, record.employeeId, record.userId)),
    name: firstDefined(getString(record.name), getString(record.fullName), `${getString(record.firstName) ?? ""} ${getString(record.lastName) ?? ""}`.trim()) || undefined,
    email: getString(record.email),
    avatarUrl: getString(record.avatarUrl),
  };
}

function canonicalStage(value: unknown): RecruitmentStage {
  const stage = (getString(value) ?? "APPLIED").toUpperCase();
  if (stage === "SCREENING") return "SHORTLISTED";
  if (stage === "TECHNICAL" || stage === "HR_REVIEW") return "INTERVIEW";
  if (stage === "WITHDRAWN") return "REJECTED";
  return stage as RecruitmentStage;
}

function job(value: unknown): RecruitmentJobPosition {
  const record = asRecord(value);
  return {
    id: getId(record.id),
    title: getString(record.title) ?? "Untitled job",
    slug: getString(record.slug),
    department: getString(record.department),
    description: getString(record.description),
    employmentType: getString(record.employmentType)?.toUpperCase() as RecruitmentJobPosition["employmentType"],
    location: getString(record.location),
    experience: getString(record.experience),
    openings: getNumber(record.openings),
    status: (getString(record.status)?.toUpperCase() ?? "OPEN") as RecruitmentJobPosition["status"],
    published: bool(record.published),
    visibleToExternalApplicants: record.visibleToExternalApplicants == null ? true : bool(record.visibleToExternalApplicants),
    expiresAt: toIsoDateTime(record.expiresAt),
    publishedAt: toIsoDateTime(record.publishedAt),
    applicationCount: getNumber(record.applicationCount) ?? 0,
    createdAt: toIsoDateTime(record.createdAt),
    updatedAt: toIsoDateTime(record.updatedAt),
  };
}

function candidate(value: unknown): RecruitmentCandidate {
  const record = asRecord(value);
  return {
    id: getId(record.id),
    fullName: getString(record.fullName) ?? "Unknown candidate",
    email: getString(record.email) ?? "",
    phone: getString(record.phone),
    currentCity: getString(record.currentCity),
    country: getString(record.country),
    linkedinUrl: getString(record.linkedinUrl),
    portfolioUrl: getString(record.portfolioUrl),
    currentCompany: getString(record.currentCompany),
    currentTitle: getString(record.currentTitle),
    yearsOfExperience: getNumber(record.yearsOfExperience),
    source: getString(record.source),
    summary: getString(record.summary),
    resumeFileName: getString(record.resumeFileName),
    resumeFileUrl: getString(record.resumeFileUrl),
    resumeMimeType: getString(record.resumeMimeType),
    resumeFileSizeBytes: getNumber(record.resumeFileSizeBytes),
  };
}

function application(value: unknown): RecruitmentApplication {
  const record = asRecord(value);
  return {
    id: getId(record.id),
    referenceNumber: getString(record.referenceNumber),
    candidate: candidate(record.candidate),
    jobPosition: job(record.jobPosition),
    status: canonicalStage(record.status),
    coverLetter: getString(record.coverLetter),
    expectedSalary: getNumber(record.expectedSalary),
    availableFrom: getString(record.availableFrom),
    source: getString(record.source),
    recruiterNotes: getString(record.recruiterNotes),
    rejectedReason: getString(record.rejectedReason),
    appliedAt: toIsoDateTime(record.appliedAt),
    updatedAt: toIsoDateTime(record.updatedAt),
    offeredAt: toIsoDateTime(record.offeredAt),
    hiredAt: toIsoDateTime(record.hiredAt),
    hiredEmployeeId: record.hiredEmployeeId == null ? undefined : getId(record.hiredEmployeeId),
    version: getNumber(record.version),
    createdBy: record.createdBy ? employeeSummary(record.createdBy) : null,
  };
}

function interview(value: unknown): RecruitmentInterview {
  const record = asRecord(value);
  const feedback = asRecord(record.feedback);
  return {
    id: getId(record.id),
    applicationId: getId(record.applicationId),
    candidate: candidate(record.candidate),
    jobPosition: job(record.jobPosition),
    interviewer: employeeSummary(record.interviewer),
    mode: (getString(record.mode)?.toUpperCase() ?? "REMOTE") as RecruitmentInterview["mode"],
    status: (getString(record.status)?.toUpperCase() ?? "SCHEDULED") as RecruitmentInterview["status"],
    scheduledAt: toIsoDateTime(record.scheduledAt),
    location: getString(record.location),
    meetingLink: getString(record.meetingLink),
    notes: getString(record.notes),
    feedback: Object.keys(feedback).length > 0 ? {
      id: getId(feedback.id),
      reviewer: feedback.reviewer ? employeeSummary(feedback.reviewer) : null,
      rating: getNumber(feedback.rating),
      recommendation: getString(feedback.recommendation),
      strengths: getString(feedback.strengths),
      concerns: getString(feedback.concerns),
      notes: getString(feedback.notes),
    } : null,
  };
}

function note(value: unknown): RecruitmentCandidateComment {
  const record = asRecord(value);
  return { id: getId(record.id), candidateId: getId(record.candidateId), message: getString(record.message) ?? "", createdAt: toIsoDateTime(record.createdAt), author: employeeSummary(record.author) };
}

function event(value: unknown): RecruitmentApplicationEvent {
  const record = asRecord(value);
  return { id: getId(record.id), eventType: getString(record.eventType) ?? "UPDATE", title: getString(record.title) ?? "Application updated", detail: getString(record.detail), occurredAt: toIsoDateTime(record.occurredAt), actor: employeeSummary(record.actor) };
}

function emailLog(value: unknown): RecruitmentEmailLog {
  const record = asRecord(value);
  return {
    id: getId(record.id),
    templateType: (getString(record.templateType)?.toUpperCase() ?? "APPLICATION_RECEIVED") as RecruitmentEmailTemplateType,
    recipientEmail: getString(record.recipientEmail) ?? "",
    subject: getString(record.subject) ?? "",
    deliveryStatus: getString(record.deliveryStatus) ?? "QUEUED",
    sentAt: toIsoDateTime(record.sentAt),
  };
}

function emailTemplate(value: unknown): RecruitmentEmailTemplate {
  const record = asRecord(value);
  return {
    id: getId(record.id),
    type: (getString(record.type)?.toUpperCase() ?? "APPLICATION_RECEIVED") as RecruitmentEmailTemplateType,
    subject: getString(record.subject) ?? "",
    bodyMarkdown: getString(record.bodyMarkdown) ?? "",
    enabled: bool(record.enabled, true),
    availableVariables: extractList(record.availableVariables).map(getString).filter((item): item is string => Boolean(item)),
    updatedAt: toIsoDateTime(record.updatedAt),
  };
}

function page<T>(value: unknown, normalize: (item: unknown) => T): PaginatedResult<T> {
  const record = asRecord(value);
  const items = extractList(firstDefined(record.items, record.content, record.results, record.data)).map(normalize);
  return { items, page: getNumber(record.page) ?? 0, size: getNumber(record.size) ?? items.length, totalElements: getNumber(record.totalElements) ?? items.length, totalPages: getNumber(record.totalPages) ?? (items.length ? 1 : 0) };
}

async function data<T>(method: "get" | "post" | "put" | "patch" | "delete", url: string, body?: unknown, params?: unknown): Promise<T> {
  const response = await apiClient.request<ApiResponse<T>>({ method, url, data: body, params });
  return unwrapApiData(response.data);
}

export async function getJobPositions(params: ListParams = {}): Promise<PaginatedResult<RecruitmentJobPosition>> {
  return page(await data<unknown>("get", "/api/tenant/recruitment/jobs", undefined, params), job);
}

export async function getAllJobPositions(): Promise<RecruitmentJobPosition[]> {
  return collectAllPages((pageNumber) => getJobPositions({ page: pageNumber, size: 100, sortBy: "createdAt", sortDir: "desc" }));
}

export async function getJobPosition(id: string): Promise<RecruitmentJobPosition> {
  return job(await data<unknown>("get", `/api/tenant/recruitment/jobs/${id}`));
}

function jobPayload(values: RecruitmentJobFormValues) {
  return {
    title: values.title.trim(), department: values.department.trim(), employmentType: values.employmentType,
    location: values.location.trim() || null, experience: values.experience.trim() || null,
    expiresAt: values.expiresAt ? `${values.expiresAt}T23:59:59` : null,
    openings: values.openings, description: values.description.trim(), visibleToExternalApplicants: true,
  };
}

export async function createJobPosition(values: RecruitmentJobFormValues): Promise<RecruitmentJobPosition> {
  return job(await data<unknown>("post", "/api/tenant/recruitment/jobs", { ...jobPayload(values), status: "OPEN", published: false }));
}

export async function updateJobPosition(id: string, values: RecruitmentJobFormValues, current: RecruitmentJobPosition): Promise<RecruitmentJobPosition> {
  return job(await data<unknown>("put", `/api/tenant/recruitment/jobs/${id}`, { ...jobPayload(values), status: current.status, published: current.published }));
}

export async function runJobAction(id: string, action: "publish" | "unpublish" | "close" | "reopen" | "duplicate"): Promise<RecruitmentJobPosition> {
  return job(await data<unknown>("post", `/api/tenant/recruitment/jobs/${id}/${action}`));
}

export async function deleteJobPosition(id: string): Promise<void> {
  await data("delete", `/api/tenant/recruitment/jobs/${id}`);
}

export async function getApplications(params: ApplicationListParams = {}): Promise<PaginatedResult<RecruitmentApplication>> {
  const query = { ...params, status: params.status || undefined };
  return page(await data<unknown>("get", "/api/tenant/recruitment/applications", undefined, query), application);
}

export async function getAllApplications(): Promise<RecruitmentApplication[]> {
  return collectAllPages((pageNumber) => getApplications({ page: pageNumber, size: 100, sortBy: "appliedAt", sortDir: "desc" }));
}

export async function getApplication(id: string): Promise<RecruitmentApplication> {
  return application(await data<unknown>("get", `/api/tenant/recruitment/applications/${id}`));
}

export async function updateApplicationStatus(id: string, status: RecruitmentStage, rejectedReason?: string): Promise<RecruitmentApplication> {
  return application(await data<unknown>("patch", `/api/tenant/recruitment/applications/${id}/status`, { status, rejectedReason }));
}

export async function getApplicationNotes(id: string): Promise<RecruitmentCandidateComment[]> {
  return extractList(await data<unknown>("get", `/api/tenant/recruitment/applications/${id}/notes`)).map(note);
}

export async function addApplicationNote(id: string, message: string): Promise<RecruitmentCandidateComment> {
  return note(await data<unknown>("post", `/api/tenant/recruitment/applications/${id}/notes`, { message }));
}

export async function getApplicationTimeline(id: string): Promise<RecruitmentApplicationEvent[]> {
  return extractList(await data<unknown>("get", `/api/tenant/recruitment/applications/${id}/timeline`)).map(event);
}

export async function getApplicationEmails(id: string): Promise<RecruitmentEmailLog[]> {
  return extractList(await data<unknown>("get", `/api/tenant/recruitment/applications/${id}/emails`)).map(emailLog);
}

export async function sendApplicationEmail(id: string, templateType: RecruitmentEmailTemplateType): Promise<RecruitmentEmailLog> {
  return emailLog(await data<unknown>("post", `/api/tenant/recruitment/applications/${id}/emails`, { templateType }));
}

export async function getApplicationInterviews(id: string): Promise<RecruitmentInterview[]> {
  return extractList(await data<unknown>("get", `/api/tenant/recruitment/applications/${id}/interviews`)).map(interview);
}

export async function getInterviews(params?: { from?: string; to?: string }): Promise<RecruitmentInterview[]> {
  return extractList(await data<unknown>("get", "/api/tenant/recruitment/interviews", undefined, params)).map(interview);
}

export async function scheduleInterview(values: RecruitmentInterviewFormValues): Promise<RecruitmentInterview> {
  return interview(await data<unknown>("post", "/api/tenant/recruitment/interviews", values));
}

export async function updateInterview(id: string, values: RecruitmentInterviewFormValues): Promise<RecruitmentInterview> {
  return interview(await data<unknown>("put", `/api/tenant/recruitment/interviews/${id}`, values));
}

function normalizeEmployee(value: unknown): Employee {
  const record = asRecord(value);
  const firstName = getString(record.firstName);
  const lastName = getString(record.lastName);
  return { ...record, id: getId(record.id), firstName, lastName, name: getString(record.fullName) ?? `${firstName ?? ""} ${lastName ?? ""}`.trim(), email: getString(record.email) ?? "" };
}

export async function hireApplication(id: string, values: RecruitmentHireFormValues): Promise<RecruitmentHireResponse> {
  const payload = {
    employeeCode: values.employeeCode.trim() || null, role: values.role, designation: values.designation.trim(),
    department: values.department.trim(), joinedDate: values.joinedDate, temporaryPassword: values.temporaryPassword.trim() || null,
    teamId: values.teamId ? Number(values.teamId) : null, teamFunctionalRole: values.teamFunctionalRole,
    salary: values.salary ? Number(values.salary) : null, recruiterNotes: values.recruiterNotes.trim() || null,
  };
  const record = asRecord(await data<unknown>("post", `/api/tenant/recruitment/applications/${id}/hire`, payload));
  return { application: application(record.application), employee: normalizeEmployee(record.employee), teamId: record.teamId == null ? undefined : getId(record.teamId), teamName: getString(record.teamName), accountProvisioned: bool(record.accountProvisioned) };
}

export async function getEmailTemplates(): Promise<RecruitmentEmailTemplate[]> {
  return extractList(await data<unknown>("get", "/api/tenant/recruitment/email-templates")).map(emailTemplate);
}

export async function updateEmailTemplate(template: RecruitmentEmailTemplate): Promise<RecruitmentEmailTemplate> {
  return emailTemplate(await data<unknown>("put", `/api/tenant/recruitment/email-templates/${template.type}`, { subject: template.subject, bodyMarkdown: template.bodyMarkdown, enabled: template.enabled }));
}

async function collectAllPages<T>(fetchPage: (pageNumber: number) => Promise<PaginatedResult<T>>): Promise<T[]> {
  const firstPage = await fetchPage(0);
  const items = [...firstPage.items];
  for (let pageNumber = 1; pageNumber < firstPage.totalPages; pageNumber += 1) {
    items.push(...(await fetchPage(pageNumber)).items);
  }
  return items;
}

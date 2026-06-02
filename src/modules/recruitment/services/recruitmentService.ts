import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList, firstDefined, getId, getNumber, getString, toIsoDateTime } from "@/services/http/parsers";
import type { ApiResponse } from "@/types";
import type {
  PaginatedResult,
  RecruitmentApplication,
  RecruitmentApplicationFormValues,
  RecruitmentCandidate,
  RecruitmentCandidateComment,
  RecruitmentCandidateFormValues,
  RecruitmentDashboard,
  RecruitmentFeedbackFormValues,
  RecruitmentInterview,
  RecruitmentInterviewFormValues,
  RecruitmentJobFormValues,
  RecruitmentJobPosition,
  RecruitmentPipeline,
} from "@/modules/recruitment/types";

function normalizeBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return undefined;
}

function normalizeEmployeeSummary(value: unknown) {
  const record = asRecord(value);
  return {
    id: getId(firstDefined(record.id, record.employeeId, record.userId)),
    name: firstDefined(getString(record.name), getString(record.fullName), `${getString(record.firstName) ?? ""} ${getString(record.lastName) ?? ""}`.trim()) || undefined,
    email: getString(record.email),
  };
}

function normalizeJobPosition(value: unknown): RecruitmentJobPosition {
  const record = asRecord(value);
  return {
    id: getId(record.id),
    title: getString(record.title) ?? "Untitled position",
    department: getString(record.department),
    description: getString(record.description),
    employmentType: getString(record.employmentType)?.toUpperCase() as RecruitmentJobPosition["employmentType"],
    location: getString(record.location),
    openings: getNumber(record.openings),
    status: getString(record.status)?.toUpperCase() as RecruitmentJobPosition["status"],
    published: normalizeBoolean(record.published),
    applicationCount: getNumber(record.applicationCount),
    createdAt: toIsoDateTime(record.createdAt),
    updatedAt: toIsoDateTime(record.updatedAt),
  };
}

function normalizeCandidate(value: unknown): RecruitmentCandidate {
  const record = asRecord(value);
  return {
    id: getId(record.id),
    fullName: getString(record.fullName) ?? "Unknown candidate",
    email: getString(record.email) ?? "",
    phone: getString(record.phone),
    currentTitle: getString(record.currentTitle),
    yearsOfExperience: getNumber(record.yearsOfExperience),
    source: getString(record.source),
    summary: getString(record.summary),
    resumeFileName: getString(record.resumeFileName),
    resumeFileUrl: getString(record.resumeFileUrl),
    resumeMimeType: getString(record.resumeMimeType),
    resumeFileSizeBytes: getNumber(record.resumeFileSizeBytes),
    createdAt: toIsoDateTime(record.createdAt),
    updatedAt: toIsoDateTime(record.updatedAt),
  };
}

function normalizeComment(value: unknown): RecruitmentCandidateComment {
  const record = asRecord(value);
  return {
    id: getId(record.id),
    candidateId: getId(record.candidateId),
    message: getString(record.message) ?? "",
    createdAt: toIsoDateTime(record.createdAt),
    author: normalizeEmployeeSummary(record.author),
  };
}

function normalizeApplication(value: unknown): RecruitmentApplication {
  const record = asRecord(value);
  return {
    id: getId(record.id),
    candidate: normalizeCandidate(record.candidate),
    jobPosition: normalizeJobPosition(record.jobPosition),
    status: (getString(record.status)?.toUpperCase() ?? "APPLIED") as RecruitmentApplication["status"],
    coverLetter: getString(record.coverLetter),
    expectedSalary: getNumber(record.expectedSalary),
    recruiterNotes: getString(record.recruiterNotes),
    rejectedReason: getString(record.rejectedReason),
    createdBy: normalizeEmployeeSummary(record.createdBy),
    appliedAt: toIsoDateTime(record.appliedAt),
    updatedAt: toIsoDateTime(record.updatedAt),
    offeredAt: toIsoDateTime(record.offeredAt),
    hiredAt: toIsoDateTime(record.hiredAt),
  };
}

function normalizeInterview(value: unknown): RecruitmentInterview {
  const record = asRecord(value);
  return {
    id: getId(record.id),
    applicationId: getId(record.applicationId),
    candidate: normalizeCandidate(record.candidate),
    jobPosition: normalizeJobPosition(record.jobPosition),
    interviewer: normalizeEmployeeSummary(record.interviewer),
    mode: getString(record.mode)?.toUpperCase() as RecruitmentInterview["mode"],
    status: getString(record.status)?.toUpperCase() as RecruitmentInterview["status"],
    scheduledAt: toIsoDateTime(record.scheduledAt),
    location: getString(record.location),
    meetingLink: getString(record.meetingLink),
    notes: getString(record.notes),
    feedback: record.feedback ? normalizeInterviewFeedback(record.feedback) : null,
  };
}

function normalizeInterviewFeedback(value: unknown) {
  const record = asRecord(value);
  return {
    id: getId(record.id),
    interviewId: getId(record.interviewId),
    rating: getNumber(record.rating),
    recommendation: getString(record.recommendation)?.toUpperCase() as RecruitmentInterview["feedback"] extends infer Feedback
      ? Feedback extends { recommendation?: infer Recommendation }
        ? Recommendation
        : never
      : never,
    strengths: getString(record.strengths),
    concerns: getString(record.concerns),
    notes: getString(record.notes),
    reviewer: normalizeEmployeeSummary(record.reviewer),
  };
}

function normalizeDashboard(value: unknown): RecruitmentDashboard {
  const record = asRecord(value);
  return {
    openJobs: getNumber(record.openJobs) ?? 0,
    totalCandidates: getNumber(record.totalCandidates) ?? 0,
    activeApplications: getNumber(record.activeApplications) ?? 0,
    hiredCandidates: getNumber(record.hiredCandidates) ?? 0,
    upcomingInterviews: getNumber(record.upcomingInterviews) ?? 0,
    stageCounts: extractList(record.stageCounts).map((item) => {
      const stageRecord = asRecord(item);
      return { stage: (getString(stageRecord.stage)?.toUpperCase() ?? "APPLIED") as RecruitmentDashboard["stageCounts"][number]["stage"], count: getNumber(stageRecord.count) ?? 0 };
    }),
    jobCounts: extractList(record.jobCounts).map((item) => {
      const jobRecord = asRecord(item);
      return { jobPositionId: getId(jobRecord.jobPositionId), title: getString(jobRecord.title) ?? "Untitled", count: getNumber(jobRecord.count) ?? 0 };
    }),
  };
}

function normalizePipeline(value: unknown): RecruitmentPipeline {
  const record = asRecord(value);
  return {
    columns: extractList(record.columns).map((item) => {
      const column = asRecord(item);
      return {
        stage: (getString(column.stage)?.toUpperCase() ?? "APPLIED") as RecruitmentPipeline["columns"][number]["stage"],
        label: getString(column.label) ?? "Stage",
        count: getNumber(column.count) ?? 0,
        applications: extractList(column.applications).map(normalizeApplication),
      };
    }),
  };
}

function normalizePagedResult<T>(payload: unknown, normalizer: (value: unknown) => T): PaginatedResult<T> {
  const record = asRecord(payload);
  const items = extractList(record.items ?? record.content ?? record.results ?? record.data).map(normalizer);
  return {
    items,
    page: getNumber(record.page) ?? 0,
    size: getNumber(record.size) ?? items.length,
    totalElements: getNumber(record.totalElements) ?? items.length,
    totalPages: getNumber(record.totalPages) ?? 1,
  };
}

function normalizeListResponse<T>(payload: unknown, normalizer: (value: unknown) => T): T[] {
  return extractList(payload).map(normalizer);
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, body);
  return unwrapApiData(response.data);
}

async function putJson<T>(url: string, body: unknown): Promise<T> {
  const response = await apiClient.put<ApiResponse<T>>(url, body);
  return unwrapApiData(response.data);
}

async function patchJson<T>(url: string, body: unknown): Promise<T> {
  const response = await apiClient.patch<ApiResponse<T>>(url, body);
  return unwrapApiData(response.data);
}

async function deleteJson(url: string): Promise<void> {
  await apiClient.delete(url);
}

export async function getRecruitmentDashboard(): Promise<RecruitmentDashboard> {
  const response = await apiClient.get<ApiResponse<unknown>>("/api/tenant/recruitment/dashboard");
  return normalizeDashboard(unwrapApiData(response.data));
}

export async function getJobPositions(): Promise<PaginatedResult<RecruitmentJobPosition>> {
  const response = await apiClient.get<ApiResponse<unknown>>("/api/tenant/recruitment/jobs");
  return normalizePagedResult(unwrapApiData(response.data), normalizeJobPosition);
}

export async function createJobPosition(values: RecruitmentJobFormValues): Promise<RecruitmentJobPosition> {
  return postJson("/api/tenant/recruitment/jobs", values);
}

export async function updateJobPosition(id: string, values: RecruitmentJobFormValues): Promise<RecruitmentJobPosition> {
  return putJson(`/api/tenant/recruitment/jobs/${id}`, values);
}

export async function deleteJobPosition(id: string): Promise<void> {
  return deleteJson(`/api/tenant/recruitment/jobs/${id}`);
}

export async function getCandidates(): Promise<PaginatedResult<RecruitmentCandidate>> {
  const response = await apiClient.get<ApiResponse<unknown>>("/api/tenant/recruitment/candidates");
  return normalizePagedResult(unwrapApiData(response.data), normalizeCandidate);
}

export async function createCandidate(values: RecruitmentCandidateFormValues): Promise<RecruitmentCandidate> {
  return postJson("/api/tenant/recruitment/candidates", {
    ...values,
    yearsOfExperience: values.yearsOfExperience ? Number(values.yearsOfExperience) : null,
  });
}

export async function updateCandidate(id: string, values: RecruitmentCandidateFormValues): Promise<RecruitmentCandidate> {
  return putJson(`/api/tenant/recruitment/candidates/${id}`, {
    ...values,
    yearsOfExperience: values.yearsOfExperience ? Number(values.yearsOfExperience) : null,
  });
}

export async function uploadCandidateResume(id: string, file: File): Promise<RecruitmentCandidate> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<ApiResponse<unknown>>(`/api/tenant/recruitment/candidates/${id}/resume`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return normalizeCandidate(unwrapApiData(response.data));
}

export async function getCandidateComments(candidateId: string): Promise<RecruitmentCandidateComment[]> {
  const response = await apiClient.get<ApiResponse<unknown>>(`/api/tenant/recruitment/candidates/${candidateId}/comments`);
  return normalizeListResponse(unwrapApiData(response.data), normalizeComment);
}

export async function addCandidateComment(candidateId: string, message: string): Promise<RecruitmentCandidateComment> {
  return postJson("/api/tenant/recruitment/candidates/comments", { candidateId, message });
}

export async function getApplications(): Promise<PaginatedResult<RecruitmentApplication>> {
  const response = await apiClient.get<ApiResponse<unknown>>("/api/tenant/recruitment/applications");
  return normalizePagedResult(unwrapApiData(response.data), normalizeApplication);
}

export async function updateApplicationStatus(applicationId: string, status: RecruitmentApplication["status"]): Promise<RecruitmentApplication> {
  return patchJson(`/api/tenant/recruitment/applications/${applicationId}/status`, { status });
}

export async function createApplication(values: RecruitmentApplicationFormValues): Promise<RecruitmentApplication> {
  return postJson("/api/tenant/recruitment/applications", {
    candidateId: values.candidateId,
    jobPositionId: values.jobPositionId,
    status: values.status,
    coverLetter: values.coverLetter,
    expectedSalary: values.expectedSalary ? Number(values.expectedSalary) : null,
  });
}

export async function updateApplication(applicationId: string, status: RecruitmentApplication["status"], recruiterNotes?: string, rejectedReason?: string): Promise<RecruitmentApplication> {
  return patchJson(`/api/tenant/recruitment/applications/${applicationId}`, {
    status,
    recruiterNotes,
    rejectedReason,
  });
}

export async function getPipeline(jobPositionId?: string): Promise<RecruitmentPipeline> {
  const params = jobPositionId ? { jobPositionId } : undefined;
  const response = await apiClient.get<ApiResponse<unknown>>("/api/tenant/recruitment/pipeline", { params });
  return normalizePipeline(unwrapApiData(response.data));
}

export async function getInterviews(): Promise<RecruitmentInterview[]> {
  const response = await apiClient.get<ApiResponse<unknown>>("/api/tenant/recruitment/interviews");
  return normalizeListResponse(unwrapApiData(response.data), normalizeInterview);
}

export async function scheduleInterview(values: RecruitmentInterviewFormValues): Promise<RecruitmentInterview> {
  return postJson("/api/tenant/recruitment/interviews", {
    applicationId: values.applicationId,
    interviewerEmployeeId: values.interviewerEmployeeId,
    scheduledAt: values.scheduledAt,
    mode: values.mode,
    location: values.location,
    meetingLink: values.meetingLink,
    notes: values.notes,
  });
}

export async function updateInterview(interviewId: string, values: RecruitmentInterviewFormValues): Promise<RecruitmentInterview> {
  return putJson(`/api/tenant/recruitment/interviews/${interviewId}`, {
    applicationId: values.applicationId,
    interviewerEmployeeId: values.interviewerEmployeeId,
    scheduledAt: values.scheduledAt,
    mode: values.mode,
    location: values.location,
    meetingLink: values.meetingLink,
    notes: values.notes,
  });
}

export async function submitInterviewFeedback(values: RecruitmentFeedbackFormValues): Promise<RecruitmentInterview> {
  return postJson("/api/tenant/recruitment/interviews/feedback", {
    interviewId: values.interviewId,
    rating: values.rating ? Number(values.rating) : null,
    recommendation: values.recommendation,
    strengths: values.strengths,
    concerns: values.concerns,
    notes: values.notes,
  });
}
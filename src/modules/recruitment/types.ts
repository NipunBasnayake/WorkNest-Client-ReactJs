export type RecruitmentJobStatus = "OPEN" | "PAUSED" | "CLOSED";
export type RecruitmentEmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN" | "REMOTE" | "HYBRID";
export type RecruitmentStage = "APPLIED" | "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "HIRED" | "REJECTED";
export type RecruitmentInterviewMode = "ONSITE" | "REMOTE" | "PHONE";
export type RecruitmentInterviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
export type RecruitmentHireRole = "MANAGER" | "EMPLOYEE";
export type RecruitmentHireTeamRole = "MEMBER" | "TEAM_LEAD" | "PROJECT_MANAGER" | "BUSINESS_ANALYST" | "DEVELOPER" | "QA" | "DESIGNER";
export type RecruitmentEmailTemplateType =
  | "APPLICATION_RECEIVED"
  | "SHORTLISTED"
  | "INTERVIEW_INVITATION"
  | "INTERVIEW_RESCHEDULED"
  | "OFFER"
  | "REJECTED"
  | "WELCOME_EMPLOYEE";

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface RecruitmentEmployeeSummary {
  id?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

export interface RecruitmentJobPosition {
  id: string;
  title: string;
  slug?: string;
  department?: string;
  description?: string;
  employmentType?: RecruitmentEmploymentType;
  location?: string;
  experience?: string;
  openings?: number;
  status: RecruitmentJobStatus;
  published: boolean;
  visibleToExternalApplicants?: boolean;
  expiresAt?: string;
  publishedAt?: string;
  applicationCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecruitmentCandidate {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  currentCity?: string;
  country?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  currentCompany?: string;
  currentTitle?: string;
  yearsOfExperience?: number;
  source?: string;
  summary?: string;
  resumeFileName?: string;
  resumeFileUrl?: string;
  resumeMimeType?: string;
  resumeFileSizeBytes?: number;
}

export interface RecruitmentApplication {
  id: string;
  referenceNumber?: string;
  candidate: RecruitmentCandidate;
  jobPosition: RecruitmentJobPosition;
  status: RecruitmentStage;
  coverLetter?: string;
  expectedSalary?: number;
  availableFrom?: string;
  source?: string;
  recruiterNotes?: string;
  rejectedReason?: string;
  appliedAt?: string;
  updatedAt?: string;
  offeredAt?: string;
  hiredAt?: string;
  hiredEmployeeId?: string;
  version?: number;
  createdBy?: RecruitmentEmployeeSummary | null;
}

export interface RecruitmentCandidateComment {
  id: string;
  candidateId: string;
  message: string;
  createdAt?: string;
  author?: RecruitmentEmployeeSummary | null;
}

export interface RecruitmentApplicationEvent {
  id: string;
  eventType: string;
  title: string;
  detail?: string;
  occurredAt?: string;
  actor?: RecruitmentEmployeeSummary | null;
}

export interface RecruitmentEmailLog {
  id: string;
  templateType: RecruitmentEmailTemplateType;
  recipientEmail: string;
  subject: string;
  deliveryStatus: string;
  sentAt?: string;
}

export interface RecruitmentEmailTemplate {
  id: string;
  type: RecruitmentEmailTemplateType;
  subject: string;
  bodyMarkdown: string;
  enabled: boolean;
  availableVariables: string[];
  updatedAt?: string;
}

export interface RecruitmentInterview {
  id: string;
  applicationId: string;
  candidate: RecruitmentCandidate;
  jobPosition: RecruitmentJobPosition;
  interviewer?: RecruitmentEmployeeSummary | null;
  mode: RecruitmentInterviewMode;
  status: RecruitmentInterviewStatus;
  scheduledAt: string;
  location?: string;
  meetingLink?: string;
  notes?: string;
  feedback?: {
    id: string;
    reviewer?: RecruitmentEmployeeSummary | null;
    rating?: number;
    recommendation?: string;
    strengths?: string;
    concerns?: string;
    notes?: string;
  } | null;
}

export interface RecruitmentDashboardSummary {
  openJobs: number;
  applicationsReceived: number;
  shortlisted: number;
  interviewsScheduled: number;
  offers: number;
  hired: number;
  recentApplications: Array<{
    id: string;
    candidateName: string;
    jobTitle: string;
    status: RecruitmentStage;
    appliedAt?: string;
  }>;
  upcomingInterviews: Array<{
    id: string;
    applicationId: string;
    candidateName: string;
    jobTitle: string;
    mode: RecruitmentInterviewMode;
    scheduledAt: string;
  }>;
}

export interface RecruitmentJobFormValues {
  title: string;
  department: string;
  employmentType: RecruitmentEmploymentType;
  location: string;
  experience: string;
  expiresAt: string;
  openings: number;
  description: string;
}

export interface RecruitmentHireFormValues {
  employeeCode: string;
  role: RecruitmentHireRole;
  designation: string;
  department: string;
  joinedDate: string;
  temporaryPassword: string;
  teamId: string;
  teamFunctionalRole: RecruitmentHireTeamRole;
  salary: string;
  recruiterNotes: string;
}

export interface RecruitmentHireResponse {
  application: RecruitmentApplication;
  employee: import("@/types").Employee;
  teamId?: string;
  teamName?: string;
  accountProvisioned: boolean;
}

export interface RecruitmentInterviewFormValues {
  applicationId: string;
  scheduledAt: string;
  mode: RecruitmentInterviewMode;
  location: string;
  meetingLink: string;
  notes: string;
}

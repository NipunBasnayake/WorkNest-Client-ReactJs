export type RecruitmentJobStatus = "OPEN" | "PAUSED" | "CLOSED";
export type RecruitmentEmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN" | "REMOTE" | "HYBRID";
export type RecruitmentStage =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "TECHNICAL"
  | "HR_REVIEW"
  | "OFFERED"
  | "HIRED"
  | "REJECTED";
export type RecruitmentInterviewMode = "ONSITE" | "REMOTE" | "PHONE";
export type RecruitmentInterviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
export type RecruitmentInterviewRecommendation = "STRONG_HIRE" | "HIRE" | "HOLD" | "NO_HIRE";
export type RecruitmentHireRole = "TENANT_ADMIN" | "ADMIN" | "MANAGER" | "HR" | "EMPLOYEE";
export type RecruitmentHireTeamRole =
  | "MEMBER"
  | "TEAM_LEAD"
  | "PROJECT_MANAGER"
  | "BUSINESS_ANALYST"
  | "DEVELOPER"
  | "QA"
  | "DESIGNER";

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface RecruitmentJobPosition {
  id: string;
  title: string;
  department?: string;
  description?: string;
  employmentType?: RecruitmentEmploymentType;
  location?: string;
  openings?: number;
  status?: RecruitmentJobStatus;
  published?: boolean;
  applicationCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecruitmentCandidate {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  currentTitle?: string;
  yearsOfExperience?: number;
  source?: string;
  summary?: string;
  resumeFileName?: string;
  resumeFileUrl?: string;
  resumeMimeType?: string;
  resumeFileSizeBytes?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecruitmentCandidateComment {
  id: string;
  candidateId: string;
  message: string;
  createdAt?: string;
  author?: { id?: string; name?: string; email?: string } | null;
}

export interface RecruitmentApplication {
  id: string;
  candidate: RecruitmentCandidate;
  jobPosition: RecruitmentJobPosition;
  status: RecruitmentStage;
  coverLetter?: string;
  expectedSalary?: number | string;
  recruiterNotes?: string;
  rejectedReason?: string;
  createdBy?: { id?: string; name?: string; email?: string } | null;
  appliedAt?: string;
  updatedAt?: string;
  offeredAt?: string;
  hiredAt?: string;
}

export interface RecruitmentInterviewFeedback {
  id: string;
  interviewId: string;
  rating?: number;
  recommendation?: RecruitmentInterviewRecommendation;
  strengths?: string;
  concerns?: string;
  notes?: string;
  reviewer?: { id?: string; name?: string; email?: string } | null;
}

export interface RecruitmentInterview {
  id: string;
  applicationId: string;
  candidate: RecruitmentCandidate;
  jobPosition: RecruitmentJobPosition;
  interviewer?: { id?: string; name?: string; email?: string } | null;
  mode: RecruitmentInterviewMode;
  status: RecruitmentInterviewStatus;
  scheduledAt: string;
  location?: string;
  meetingLink?: string;
  notes?: string;
  feedback?: RecruitmentInterviewFeedback | null;
}

export interface RecruitmentDashboard {
  openJobs: number;
  totalCandidates: number;
  activeApplications: number;
  hiredCandidates: number;
  upcomingInterviews: number;
  stageCounts: Array<{ stage: RecruitmentStage; count: number }>;
  jobCounts: Array<{ jobPositionId: string; title: string; count: number }>;
}

export interface RecruitmentPipelineColumn {
  stage: RecruitmentStage;
  label: string;
  count: number;
  applications: RecruitmentApplication[];
}

export interface RecruitmentPipeline {
  columns: RecruitmentPipelineColumn[];
}

export interface RecruitmentJobFormValues {
  title: string;
  department: string;
  description: string;
  employmentType: RecruitmentEmploymentType;
  location: string;
  openings: number;
  status: RecruitmentJobStatus;
  published: boolean;
}

export interface RecruitmentCandidateFormValues {
  fullName: string;
  email: string;
  phone: string;
  currentTitle: string;
  yearsOfExperience: string;
  source: string;
  summary: string;
}

export interface RecruitmentApplicationFormValues {
  candidateId: string;
  jobPositionId: string;
  status: RecruitmentStage;
  coverLetter: string;
  expectedSalary: string;
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
  temporaryPassword?: string;
}

export interface RecruitmentInterviewFormValues {
  applicationId: string;
  interviewerEmployeeId: string;
  scheduledAt: string;
  mode: RecruitmentInterviewMode;
  location: string;
  meetingLink: string;
  notes: string;
}

export interface RecruitmentFeedbackFormValues {
  interviewId: string;
  rating: string;
  recommendation: RecruitmentInterviewRecommendation;
  strengths: string;
  concerns: string;
  notes: string;
}

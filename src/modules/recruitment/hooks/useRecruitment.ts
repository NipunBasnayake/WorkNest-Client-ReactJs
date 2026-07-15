import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import {
  getApplication,
  getApplicationEmails,
  getApplicationInterviews,
  getApplicationNotes,
  getApplicationTimeline,
  getApplications,
  getEmailTemplates,
  getJobPosition,
  getJobPositions,
  getRecruitmentDashboard,
  type ApplicationListParams,
} from "@/modules/recruitment/services/recruitmentService";

function useRecruitmentEnabled() {
  const authReady = useAuthStore((state) => state.authReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return authReady && isAuthenticated;
}

export function useRecruitmentDashboardQuery() {
  const enabled = useRecruitmentEnabled();
  return useQuery({ queryKey: ["recruitment", "dashboard"], queryFn: getRecruitmentDashboard, enabled });
}

export function useRecruitmentJobsQuery(params: { search?: string; page?: number; size?: number } = {}) {
  const enabled = useRecruitmentEnabled();
  return useQuery({ queryKey: ["recruitment", "jobs", params], queryFn: () => getJobPositions(params), enabled });
}

export function useRecruitmentJobQuery(id?: string) {
  const enabled = useRecruitmentEnabled();
  return useQuery({ queryKey: ["recruitment", "jobs", id], queryFn: () => getJobPosition(id!), enabled: enabled && Boolean(id) });
}

export function useRecruitmentApplicationsQuery(params: ApplicationListParams = {}) {
  const enabled = useRecruitmentEnabled();
  return useQuery({ queryKey: ["recruitment", "applications", params], queryFn: () => getApplications(params), enabled });
}

export function useRecruitmentApplicationQuery(id?: string) {
  const enabled = useRecruitmentEnabled();
  return useQuery({ queryKey: ["recruitment", "applications", id], queryFn: () => getApplication(id!), enabled: enabled && Boolean(id) });
}

export function useApplicationWorkspaceQueries(id?: string) {
  const enabled = useRecruitmentEnabled() && Boolean(id);
  return {
    notes: useQuery({ queryKey: ["recruitment", "applications", id, "notes"], queryFn: () => getApplicationNotes(id!), enabled }),
    timeline: useQuery({ queryKey: ["recruitment", "applications", id, "timeline"], queryFn: () => getApplicationTimeline(id!), enabled }),
    emails: useQuery({ queryKey: ["recruitment", "applications", id, "emails"], queryFn: () => getApplicationEmails(id!), enabled }),
    interviews: useQuery({ queryKey: ["recruitment", "applications", id, "interviews"], queryFn: () => getApplicationInterviews(id!), enabled }),
  };
}

export function useRecruitmentEmailTemplatesQuery() {
  const enabled = useRecruitmentEnabled();
  return useQuery({ queryKey: ["recruitment", "email-templates"], queryFn: getEmailTemplates, enabled });
}

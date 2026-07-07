import { useQuery } from "@tanstack/react-query";
import {
  getApplications,
  getCandidates,
  getInterviews,
  getJobPositions,
  getPipeline,
  getRecruitmentDashboard,
} from "@/modules/recruitment/services/recruitmentService";
import { useAuthStore } from "@/store/authStore";

export function useRecruitmentDashboardQuery() {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["recruitment", "dashboard"],
    queryFn: getRecruitmentDashboard,
    enabled: authReady && isAuthenticated,
  });
}

export function useRecruitmentJobsQuery() {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["recruitment", "jobs"],
    queryFn: getJobPositions,
    enabled: authReady && isAuthenticated,
  });
}

export function useRecruitmentCandidatesQuery() {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["recruitment", "candidates"],
    queryFn: getCandidates,
    enabled: authReady && isAuthenticated,
  });
}

export function useRecruitmentApplicationsQuery() {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["recruitment", "applications"],
    queryFn: getApplications,
    enabled: authReady && isAuthenticated,
  });
}

export function useRecruitmentPipelineQuery(jobPositionId?: string) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["recruitment", "pipeline", jobPositionId ?? "all"],
    queryFn: () => getPipeline(jobPositionId),
    enabled: authReady && isAuthenticated,
  });
}

export function useRecruitmentInterviewsQuery() {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["recruitment", "interviews"],
    queryFn: getInterviews,
    enabled: authReady && isAuthenticated,
  });
}
import { publicClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList, firstDefined, getString, toIsoDateTime } from "@/services/http/parsers";
import type { ApiResponse } from "@/types";
import type {
  PublicCareerJobDetail,
  PublicCareerJobSummary,
  PublicCareersResponse,
  PublicCompany,
  PublicEmploymentType,
} from "@/modules/careers/types";

function normalizeCompany(value: unknown): PublicCompany {
  const record = asRecord(value);
  return {
    tenantSlug: getString(record.tenantSlug) ?? getString(record.slug) ?? "",
    companyName: getString(record.companyName) ?? "Company",
    logoUrl: firstDefined(getString(record.logoUrl), getString(record.logo)),
    about: getString(record.about),
  };
}

function normalizeJobSummary(value: unknown): PublicCareerJobSummary {
  const record = asRecord(value);
  return {
    slug: getString(record.slug) ?? "",
    title: getString(record.title) ?? "Untitled role",
    department: getString(record.department),
    employmentType: getString(record.employmentType)?.toUpperCase() as PublicEmploymentType | undefined,
    location: getString(record.location),
    experience: getString(record.experience),
    salary: getString(record.salary),
    summary: getString(record.summary),
    postedDate: toIsoDateTime(record.postedDate),
    expiry: toIsoDateTime(record.expiry),
  };
}

function normalizeJobDetail(value: unknown): PublicCareerJobDetail {
  const record = asRecord(value);
  return {
    ...normalizeJobSummary(record),
    company: normalizeCompany(record.company),
    description: getString(record.description),
    responsibilities: getString(record.responsibilities),
    requirements: getString(record.requirements),
    benefits: getString(record.benefits),
    relatedJobs: extractList(record.relatedJobs).map(normalizeJobSummary),
  };
}

export async function getPublicCareers(tenantSlug: string): Promise<PublicCareersResponse> {
  const { data } = await publicClient.get<ApiResponse<PublicCareersResponse> | PublicCareersResponse>(
    `/api/public/${encodeURIComponent(tenantSlug)}/careers`
  );
  const payload = unwrapApiData<PublicCareersResponse>(data);
  const record = asRecord(payload);
  return {
    company: normalizeCompany(record.company),
    jobs: extractList(record.jobs).map(normalizeJobSummary).filter((job) => Boolean(job.slug)),
  };
}

export async function getPublicCareerDetail(tenantSlug: string, jobSlug: string): Promise<PublicCareerJobDetail> {
  const { data } = await publicClient.get<ApiResponse<PublicCareerJobDetail> | PublicCareerJobDetail>(
    `/api/public/${encodeURIComponent(tenantSlug)}/careers/${encodeURIComponent(jobSlug)}`
  );
  return normalizeJobDetail(unwrapApiData<PublicCareerJobDetail>(data));
}

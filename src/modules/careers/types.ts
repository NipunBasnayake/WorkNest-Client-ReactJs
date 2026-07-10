export type PublicEmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN" | "REMOTE" | "HYBRID";

export interface PublicCompany {
  tenantSlug: string;
  companyName: string;
  logoUrl?: string;
  about?: string;
}

export interface PublicCareerJobSummary {
  slug: string;
  title: string;
  department?: string;
  employmentType?: PublicEmploymentType;
  location?: string;
  experience?: string;
  salary?: string;
  summary?: string;
  postedDate?: string;
  expiry?: string;
}

export interface PublicCareerJobDetail extends PublicCareerJobSummary {
  company: PublicCompany;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
}

export interface PublicCareersResponse {
  company: PublicCompany;
  jobs: PublicCareerJobSummary[];
}

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

export interface PublicApplicationFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentCity: string;
  country: string;
  linkedIn: string;
  portfolio: string;
  yearsOfExperience: string;
  currentCompany: string;
  currentPosition: string;
  expectedSalary: string;
  availableFrom: string;
  coverLetter: string;
  resume: File | null;
}

export interface PublicApplicationResponse {
  referenceNumber: string;
  vacancyTitle: string;
  jobSlug: string;
  company: PublicCompany;
  submittedDate?: string;
  message?: string;
}

export interface PublicApplicationStatus {
  referenceNumber: string;
  vacancyTitle: string;
  jobSlug: string;
  status?: string;
  company: PublicCompany;
  submittedDate?: string;
}

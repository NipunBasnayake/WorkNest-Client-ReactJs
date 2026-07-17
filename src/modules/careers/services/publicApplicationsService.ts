import type { AxiosProgressEvent } from "axios";
import { publicClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, getString, toIsoDateTime } from "@/services/http/parsers";
import type { ApiResponse } from "@/types";
import type {
  PublicApplicationFormValues,
  PublicApplicationResponse,
  PublicApplicationStatus,
  PublicCompany,
} from "@/modules/careers/types";

function normalizeCompany(value: unknown): PublicCompany {
  const record = asRecord(value);
  return {
    tenantSlug: getString(record.tenantSlug) ?? getString(record.slug) ?? "",
    companyName: getString(record.companyName) ?? "Company",
    logoUrl: getString(record.logoUrl),
    about: getString(record.about),
  };
}

function normalizeApplicationResponse(value: unknown): PublicApplicationResponse {
  const record = asRecord(value);
  return {
    referenceNumber: getString(record.referenceNumber) ?? "",
    vacancyTitle: getString(record.vacancyTitle) ?? "Vacancy",
    jobSlug: getString(record.jobSlug) ?? "",
    company: normalizeCompany(record.company),
    submittedDate: toIsoDateTime(record.submittedDate),
    message: getString(record.message),
  };
}

function normalizeApplicationStatus(value: unknown): PublicApplicationStatus {
  const record = asRecord(value);
  return {
    referenceNumber: getString(record.referenceNumber) ?? "",
    vacancyTitle: getString(record.vacancyTitle) ?? "Vacancy",
    jobSlug: getString(record.jobSlug) ?? "",
    status: getString(record.status),
    company: normalizeCompany(record.company),
    submittedDate: toIsoDateTime(record.submittedDate),
  };
}

export async function submitPublicApplication(
  tenantSlug: string,
  jobSlug: string,
  values: PublicApplicationFormValues,
  onUploadProgress?: (progress: number) => void
): Promise<PublicApplicationResponse> {
  const formData = new FormData();
  const nameParts = values.fullName.trim().split(/\s+/);
  const application = {
    firstName: nameParts[0] ?? "Candidate",
    lastName: nameParts.slice(1).join(" ") || "Applicant",
    email: values.email.trim(),
    phone: optionalValue(values.phone),
    linkedIn: optionalValue(values.linkedIn),
    portfolio: optionalValue(values.portfolio),
    currentCompany: optionalValue(values.currentCompany),
    currentPosition: optionalValue(values.currentPosition),
    expectedSalary: optionalValue(values.expectedSalary),
    coverLetter: optionalValue(values.coverLetter),
  };

  formData.append(
    "application",
    new Blob([JSON.stringify(application)], { type: "application/json" })
  );
  if (!values.resume) throw new Error("Resume is required.");
  formData.append("resume", values.resume);

  const { data } = await publicClient.post<ApiResponse<unknown> | unknown>(
    `/api/public/${encodeURIComponent(tenantSlug)}/careers/${encodeURIComponent(jobSlug)}/apply`,
    formData,
    {
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (!onUploadProgress || !event.total) return;
        onUploadProgress(Math.round((event.loaded / event.total) * 100));
      },
    }
  );
  return normalizeApplicationResponse(unwrapApiData<unknown>(data));
}

export async function getPublicApplicationStatus(
  tenantSlug: string,
  referenceNumber: string
): Promise<PublicApplicationStatus> {
  const { data } = await publicClient.get<ApiResponse<unknown> | unknown>(
    `/api/public/${encodeURIComponent(tenantSlug)}/applications/${encodeURIComponent(referenceNumber)}`
  );
  return normalizeApplicationStatus(unwrapApiData<unknown>(data));
}

function optionalValue(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

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
  formData.append("firstName", nameParts[0] ?? "Candidate");
  formData.append("lastName", nameParts.slice(1).join(" ") || "Applicant");
  formData.append("email", values.email.trim());
  appendIfPresent(formData, "phone", values.phone);
  appendIfPresent(formData, "linkedIn", values.linkedIn);
  appendIfPresent(formData, "portfolio", values.portfolio);
  appendIfPresent(formData, "currentCompany", values.currentCompany);
  appendIfPresent(formData, "currentPosition", values.currentPosition);
  appendIfPresent(formData, "expectedSalary", values.expectedSalary);
  appendIfPresent(formData, "coverLetter", values.coverLetter);
  if (values.resume) {
    formData.append("resume", values.resume);
  }

  const { data } = await publicClient.post<ApiResponse<unknown> | unknown>(
    `/api/public/${encodeURIComponent(tenantSlug)}/careers/${encodeURIComponent(jobSlug)}/apply`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
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

function appendIfPresent(formData: FormData, key: string, value: string) {
  const trimmed = value.trim();
  if (trimmed) {
    formData.append(key, trimmed);
  }
}

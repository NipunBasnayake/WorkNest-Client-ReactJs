import { beforeEach, describe, expect, it, vi } from "vitest";
import { publicClient } from "@/services/http/client";
import { submitPublicApplication } from "@/modules/careers/services/publicApplicationsService";

vi.mock("@/services/http/client", () => ({
  publicClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("publicApplicationsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends JSON application and resume parts without overriding the multipart boundary", async () => {
    vi.mocked(publicClient.post).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          referenceNumber: "APP-123",
          vacancyTitle: "Software Engineer",
          jobSlug: "software-engineer",
          company: {
            tenantSlug: "residue-solutions",
            companyName: "Residue Solutions",
          },
        },
      },
    });
    const resume = new File(["%PDF-test"], "resume.pdf", { type: "application/pdf" });

    const result = await submitPublicApplication(
      "residue-solutions",
      "software-engineer",
      {
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        phone: "0771234567",
        linkedIn: "",
        portfolio: "",
        currentCompany: "",
        currentPosition: "",
        expectedSalary: "",
        coverLetter: "",
        resume,
      }
    );

    expect(result.referenceNumber).toBe("APP-123");
    expect(publicClient.post).toHaveBeenCalledOnce();
    const [url, body, config] = vi.mocked(publicClient.post).mock.calls[0];
    expect(url).toBe("/api/public/residue-solutions/careers/software-engineer/apply");
    expect(body).toBeInstanceOf(FormData);
    const multipartBody = body as FormData;
    const applicationPart = multipartBody.get("application");
    expect(applicationPart).toBeInstanceOf(Blob);
    expect((applicationPart as Blob).type).toBe("application/json");
    expect(JSON.parse(await (applicationPart as Blob).text())).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "0771234567",
    });
    expect(multipartBody.get("resume")).toBe(resume);
    expect(multipartBody.get("firstName")).toBeNull();
    expect(config).not.toHaveProperty("headers.Content-Type");
  });
});

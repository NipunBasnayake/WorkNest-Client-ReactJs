import { extractApiErrorMessage } from "@/services/http/errorMapper";

export function getErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  const mappedMessage = extractApiErrorMessage(error, fallback);
  if (mappedMessage && !isTechnicalErrorMessage(mappedMessage)) {
    return mappedMessage;
  }

  if (typeof error === "object" && error !== null) {
    const apiError = error as {
      response?: { data?: { message?: string; error?: string } };
      message?: string;
    };

    const directMessage = (
      apiError.response?.data?.message ??
      apiError.response?.data?.error ??
      apiError.message ??
      null
    );

    if (directMessage && !isTechnicalErrorMessage(directMessage)) {
      return directMessage;
    }

    return fallback;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}

function isTechnicalErrorMessage(message: string): boolean {
  return /^(AxiosError|Network Error|Request failed with status code|timeout of \d+ms exceeded)/i.test(message.trim());
}

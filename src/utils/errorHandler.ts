export function getErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (typeof error === "object" && error !== null) {
    const apiError = error as {
      response?: { data?: { message?: string; error?: string } };
      message?: string;
    };

    return (
      apiError.response?.data?.message ??
      apiError.response?.data?.error ??
      apiError.message ??
      fallback
    );
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}
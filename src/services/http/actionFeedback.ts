import { asRecord, firstDefined, getBoolean, getString } from "@/services/http/parsers";
import { readApiEnvelope } from "@/services/http/response";

export type ActionFeedbackTone = "success" | "warning" | "error";

export interface ActionFeedback {
  tone: ActionFeedbackTone;
  message: string;
}

export interface ActionResult<T> {
  data: T;
  feedback: ActionFeedback;
}

interface ActionFeedbackOptions {
  successMessage: string;
}

const EMAIL_SENT_STATUSES = new Set(["SENT", "DELIVERED", "SUCCESS", "OK"]);
const EMAIL_FAILED_STATUSES = new Set(["FAILED", "ERROR", "NOT_SENT", "UNDELIVERABLE"]);

function containsEmailAttemptKey(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value).map((key) => key.toLowerCase());
  return keys.some((key) => key.includes("email") || key.includes("mail") || key.includes("notification"));
}

function readEmailDeliveryState(payload: unknown): "sent" | "failed" | "unknown" | "none" {
  const record = asRecord(payload);
  const message = getString(firstDefined(
    record.message,
    asRecord(record.data).message,
    record.warning,
    asRecord(record.meta).message
  ))?.toLowerCase();

  const emailSent = firstDefined(
    getBoolean(record.emailSent),
    getBoolean(record.notificationEmailSent),
    getBoolean(record.notificationSent),
    getBoolean(asRecord(record.meta).emailSent),
    getBoolean(asRecord(asRecord(record.data).meta).emailSent)
  );

  const emailFailed = firstDefined(
    getBoolean(record.emailFailed),
    getBoolean(record.notificationEmailFailed),
    getBoolean(asRecord(record.meta).emailFailed),
    getBoolean(asRecord(asRecord(record.data).meta).emailFailed)
  );

  const status = getString(firstDefined(
    record.emailStatus,
    record.notificationStatus,
    asRecord(record.meta).emailStatus,
    asRecord(asRecord(record.data).meta).emailStatus
  ))?.toUpperCase();

  if (emailSent === true || (status && EMAIL_SENT_STATUSES.has(status))) {
    return "sent";
  }
  if (emailFailed === true || (status && EMAIL_FAILED_STATUSES.has(status))) {
    return "failed";
  }

  if (message && message.includes("email")) {
    if (message.includes("failed") || message.includes("could not") || message.includes("unable")) {
      return "failed";
    }
    if (message.includes("sent") || message.includes("delivered")) {
      return "sent";
    }
    return "unknown";
  }

  return containsEmailAttemptKey(record) ? "unknown" : "none";
}

function readActionMessage(payload: unknown): string | null {
  const envelope = readApiEnvelope<unknown>(payload);
  if (envelope.message && !/request failed with status code/i.test(envelope.message)) {
    return envelope.message;
  }

  const data = asRecord(envelope.data);
  const nestedMessage = firstDefined(
    getString(data.message),
    getString(data.info),
    getString(data.notice)
  );

  if (!nestedMessage || /request failed with status code/i.test(nestedMessage)) return null;
  return nestedMessage;
}

function withPeriod(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function toActionResult<T>(responsePayload: unknown, data: T, options: ActionFeedbackOptions): ActionResult<T> {
  const defaultMessage = withPeriod(options.successMessage);
  const backendMessage = readActionMessage(responsePayload);
  const emailState = readEmailDeliveryState(responsePayload);

  if (emailState === "failed") {
    const fallback = `${defaultMessage} Notification email could not be sent.`;
    const message = backendMessage && backendMessage.toLowerCase().includes("email")
      ? withPeriod(backendMessage)
      : fallback;
    return {
      data,
      feedback: {
        tone: "warning",
        message,
      },
    };
  }

  if (emailState === "sent") {
    const fallback = `${defaultMessage} Email notification sent.`;
    const message = backendMessage && backendMessage.toLowerCase().includes("email")
      ? withPeriod(backendMessage)
      : fallback;
    return {
      data,
      feedback: {
        tone: "success",
        message,
      },
    };
  }

  return {
    data,
    feedback: {
      tone: "success",
      message: backendMessage ? withPeriod(backendMessage) : defaultMessage,
    },
  };
}

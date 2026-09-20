const SENSITIVE_FIELDS: ReadonlyArray<string> = [
  "password",
  "confirmPassword",
  "currentPassword",
  "newPassword",
  "token",
  "refreshToken",
];

/**
 * Recursively redacts sensitive keys from a request body object or array.
 * Never mutates the original object.
 */
export const sanitizeBody = (body: unknown): Record<string, unknown> => {
  if (body === null || body === undefined || typeof body !== "object") {
    return {};
  }

  if (Array.isArray(body)) {
    return { data: body.map((item) => sanitizeBody(item)) };
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitizeBody(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        item !== null && typeof item === "object" ? sanitizeBody(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

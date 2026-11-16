export const API_KEY_HEADER = "x-api-key";
export const API_KEY_PREFIX = "nsk_";
export const API_KEY_NAME_MAX = 64;
export const API_KEY_MAX_EXPIRY_DAYS = 365;
export const API_KEY_RATE_LIMIT = { timeWindow: 60_000, maxRequests: 120 };

export const API_KEY_EXPIRY_OPTIONS = [
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
  { value: "never", label: "No expiration" },
];

export const apiKeyExpiresIn = (choice: string) =>
  choice === "never" ? undefined : Number(choice) * 24 * 60 * 60;

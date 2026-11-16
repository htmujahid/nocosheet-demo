export const AUTH_TOKEN_RESPONSE_HEADER = "set-auth-token";
export const AUTH_TOKEN_OPT_IN_HEADER = "x-return-auth-token";

export const clientReceivesAuthToken = (headers: Headers) =>
  !headers.has("origin") || headers.has(AUTH_TOKEN_OPT_IN_HEADER);

export const isBearerRequest = (headers: Headers) =>
  !headers.has("cookie") && /^bearer\s/i.test(headers.get("authorization") ?? "");

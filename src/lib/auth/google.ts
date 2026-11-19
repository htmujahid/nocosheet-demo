type GoogleEnv = { AUTH_GOOGLE_CLIENT_ID?: string; AUTH_GOOGLE_CLIENT_SECRET?: string };

/** Google OAuth credentials when both are configured, otherwise undefined (Google sign-in stays off). */
export function googleCredentials(env: GoogleEnv) {
  const { AUTH_GOOGLE_CLIENT_ID: clientId, AUTH_GOOGLE_CLIENT_SECRET: clientSecret } = env;
  return clientId && clientSecret ? { clientId, clientSecret } : undefined;
}

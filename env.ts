import { boolean, defineEnv, string } from "void/env";

export default defineEnv({
  // Google OAuth credentials: https://console.cloud.google.com/apis/credentials
  // Redirect URI: <origin>/api/auth/callback/google
  AUTH_GOOGLE_CLIENT_ID: string(),
  AUTH_GOOGLE_CLIENT_SECRET: string(),
  // Display name of the workspace. VITE_ keys are public and embedded in the client bundle.
  VITE_WORKSPACE_NAME: string().default("My Workspace"),
  VITE_ENABLE_SIGNUP: boolean().default(false),
  // Client-side only: disables every control under /account and /settings (read-only mode, e.g. demos).
  VITE_DISABLE_SETTINGS: boolean().default(false),
});

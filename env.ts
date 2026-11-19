import { boolean, defineEnv, string } from "void/env";

export default defineEnv({
  // Optional Google OAuth credentials: https://console.cloud.google.com/apis/credentials
  // Redirect URI: <origin>/api/auth/callback/google
  AUTH_GOOGLE_CLIENT_ID: string().optional(),
  AUTH_GOOGLE_CLIENT_SECRET: string().optional(),
  // Display name of the workspace. VITE_ keys are public and embedded in the client bundle.
  VITE_WORKSPACE_NAME: string().default("My Workspace"),
  VITE_ENABLE_SIGNUP: boolean().default(false),
  // Client-side only: demo mode. Makes /account and /settings read-only and prefills the sign-in form
  // with the demo credentials.
  VITE_DEMO_MODE: boolean().default(false),
});

import { boolean, defineEnv, string } from "void/env";

export default defineEnv({
  // Optional Google OAuth credentials: https://console.cloud.google.com/apis/credentials
  // Redirect URI: <origin>/api/auth/callback/google
  AUTH_GOOGLE_CLIENT_ID: string().optional(),
  AUTH_GOOGLE_CLIENT_SECRET: string().optional(),
  // OpenAI key for the records assistant, used via the Cloudflare AI Gateway.
  OPENAI_API_KEY: string().optional(),
  // Optional AI Gateway authentication token (cf-aig-authorization), if the gateway requires auth.
  AI_GATEWAY_TOKEN: string().optional(),
  // VITE_ keys are public and embedded in the client bundle.
  VITE_ENABLE_SIGNUP: boolean().default(false),
  // Client-side only: demo mode. Makes /account read-only and prefills the sign-in form
  // with the demo credentials.
  VITE_DEMO_MODE: boolean().default(false),
});

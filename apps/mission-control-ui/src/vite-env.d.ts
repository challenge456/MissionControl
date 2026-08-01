/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL: string;
  readonly VITE_AUTH_MODE?: "clerk" | "demo" | "legacy";
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
  readonly VITE_RUNTIME_CONTRACT_E2E_BYPASS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

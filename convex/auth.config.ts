import type { AuthConfig } from "convex/server";

// Clerk issuer URLs are public deployment configuration. This must match the
// Clerk application that provides VITE_CLERK_PUBLISHABLE_KEY to the browser.
const clerkIssuerDomain = "https://dear-sunbird-98.clerk.accounts.dev";

export default {
  providers: [
    {
      domain: clerkIssuerDomain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;

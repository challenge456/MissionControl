import type { AuthConfig } from "convex/server";

// Clerk issuer URLs are public deployment configuration. Keep the non-routable
// placeholder until the Product Owner supplies the Clerk application issuer;
// referencing an unset Convex env variable would make legacy deployments fail
// compilation before the staged authentication rollout is enabled.
const clerkIssuerDomain = "https://clerk-not-configured.invalid";

export default {
  providers: [
    {
      domain: clerkIssuerDomain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;

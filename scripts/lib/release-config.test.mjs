import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const packageJson = JSON.parse(readFileSync(path.join(repositoryRoot, "package.json"), "utf8"));
const vercel = JSON.parse(readFileSync(path.join(repositoryRoot, "vercel.json"), "utf8"));
const workflow = readFileSync(path.join(repositoryRoot, ".github/workflows/ci.yml"), "utf8");

describe("release configuration", () => {
  it("uses a frozen lockfile in every dependency installation", () => {
    const installs = workflow.match(/pnpm install[^\n]*/g) ?? [];
    expect(installs.length).toBeGreaterThan(0);
    expect(installs.every((line) => line.includes("--frozen-lockfile"))).toBe(true);
    expect(vercel.installCommand).toContain("pnpm install --frozen-lockfile");
  });

  it("pins every GitHub Action to a full commit SHA", () => {
    const actionRefs = [...workflow.matchAll(/uses:\s+[^@\s]+@([^\s]+)/g)].map((match) => match[1]);
    expect(actionRefs.length).toBeGreaterThan(0);
    expect(actionRefs.every((ref) => /^[0-9a-f]{40}$/.test(ref))).toBe(true);
  });

  it("uses packageManager as the sole pnpm version authority", () => {
    expect(packageJson.packageManager).toBe("pnpm@9.0.0");
    expect(workflow).not.toMatch(/uses:\s+pnpm\/action-setup@[^\n]+\n\s+with:/);
  });

  it("keeps the SPA rewrite scoped to v2 routes", () => {
    expect(vercel.rewrites).toEqual([
      { source: "/v2", destination: "/index.html" },
      { source: "/v2/:path*", destination: "/index.html" },
    ]);
    expect(vercel.rewrites.some((rewrite) => ["/:path*", "/(.*)"].includes(rewrite.source))).toBe(false);
  });

  it("sets the minimum browser security headers", () => {
    const headers = Object.fromEntries(vercel.headers[0].headers.map((header) => [header.key, header.value]));
    expect(headers).toMatchObject({
      "Content-Security-Policy": "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    });
  });
});

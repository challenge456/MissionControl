/**
 * Convex HTTP Routes — Stripe webhooks and external integrations
 *
 * Stripe webhook signature is verified with STRIPE_WEBHOOK_SECRET (whsec_...) when set.
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import {
  extractPrFromWebhookEvent,
  verifyGithubWebhookSignature,
} from "./lib/githubCiIngest";

const http = httpRouter();

/**
 * Verify Stripe-Signature header (HMAC-SHA256) using Web Crypto.
 * Header format: "t=timestamp,v1=hex_signature[,v0=...]"
 * Signed payload: "${timestamp}.${rawBody}"
 */
async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;
  const parts = signatureHeader.split(",").reduce((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {} as Record<string, string>);
  const timestamp = parts["t"];
  const v1 = parts["v1"];
  if (!timestamp || !v1) return false;
  const signedPayload = `${timestamp}.${rawBody}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(signedPayload)
  );
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (v1.length !== expected.length) return false;
  let eq = true;
  for (let i = 0; i < v1.length; i++) {
    if (v1[i] !== expected[i]) eq = false;
  }
  return eq;
}

http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (secret) {
      const valid = await verifyStripeSignature(body, signature, secret);
      if (!valid) {
        return new Response("Webhook signature verification failed", { status: 401 });
      }
    }

    let event: {
      id: string;
      type: string;
      data: { object: Record<string, any> };
    };
    try {
      event = JSON.parse(body);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const obj = event.data?.object;
    if (!obj) {
      return new Response("Missing event data", { status: 400 });
    }

    const typeMap: Record<string, string> = {
      "charge.succeeded": "CHARGE",
      "invoice.paid": "SUBSCRIPTION",
      "charge.refunded": "REFUND",
      "payout.paid": "PAYOUT",
    };

    const eventType = typeMap[event.type];
    if (!eventType) {
      return new Response("OK (ignored)", { status: 200 });
    }

    const amount = (obj.amount ?? obj.amount_paid ?? 0) / 100;
    const currency = (obj.currency ?? "usd").toUpperCase();

    await ctx.runMutation(api.revenue.record, {
      source: "STRIPE",
      eventType: eventType as "CHARGE" | "SUBSCRIPTION" | "REFUND" | "PAYOUT",
      amount,
      currency,
      description: obj.description ?? event.type,
      customerId: obj.customer ?? undefined,
      customerEmail: obj.receipt_email ?? obj.customer_email ?? undefined,
      externalId: event.id,
      externalRef: obj.id,
    });

    return new Response("OK", { status: 200 });
  }),
});

http.route({
  path: "/github/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    const signature = request.headers.get("x-hub-signature-256");
    if (!secret) {
      return new Response("GitHub webhook is not configured", { status: 503 });
    }
    const valid = await verifyGithubWebhookSignature(body, signature, secret);
    if (!valid) {
      return new Response("GitHub webhook signature verification failed", { status: 401 });
    }

    const event = request.headers.get("x-github-event") ?? "";
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(body);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const prRef = extractPrFromWebhookEvent(event, payload);
    if (!prRef) {
      return new Response("OK (ignored)", { status: 200 });
    }

    if (
      event === "pull_request" &&
      !["opened", "synchronize", "reopened"].includes(String(payload.action ?? ""))
    ) {
      return new Response("OK (ignored action)", { status: 200 });
    }

    if (event === "check_run" && payload.action !== "completed") {
      return new Response("OK (ignored action)", { status: 200 });
    }

    if (event === "pull_request_review" && payload.action !== "submitted") {
      return new Response("OK (ignored action)", { status: 200 });
    }

    await ctx.runAction(api.factory.prChecks.ingestPullRequest, {
      prUrl: prRef.prUrl,
      sourceEventId: request.headers.get("x-github-delivery") ?? undefined,
    });

    const review = payload.review as { state?: string; body?: string; html_url?: string } | undefined;
    if (event === "pull_request_review" && review?.state === "changes_requested") {
      const projects = await ctx.runQuery(api.projects.list, {});
      const project = projects.find((candidate) => candidate.githubRepo?.toLowerCase() === `${prRef.owner}/${prRef.repo}`.toLowerCase());
      if (project) {
        await ctx.runMutation(internal.factory.metaLoop.ingestSignal, {
          projectId: project._id,
          kind: "SKILL_UPDATE",
          signalClass: "REVIEW_CORRECTION",
          target: `${prRef.owner}/${prRef.repo}`,
          title: `Reduce recurring review correction in ${prRef.repo}`,
          summary: review.body?.slice(0, 1_000) || "Pull request review requested changes.",
          sourceRef: request.headers.get("x-github-delivery") ?? review.html_url ?? prRef.prUrl,
          sourceLinks: [review.html_url ?? prRef.prUrl],
          confidence: 0.75,
          impact: "MEDIUM",
          payload: { prUrl: prRef.prUrl },
        });
      }
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;

"use strict";
/**
 * Content Drops — Agent-submitted deliverables
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatus = exports.seedContentDrops = exports.getStats = exports.submit = exports.listByAgent = exports.get = exports.list = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var contentTypeValidator = values_1.v.union(values_1.v.literal("BLOG_POST"), values_1.v.literal("SOCIAL_POST"), values_1.v.literal("EMAIL_DRAFT"), values_1.v.literal("SCRIPT"), values_1.v.literal("REPORT"), values_1.v.literal("CODE_SNIPPET"), values_1.v.literal("DESIGN"), values_1.v.literal("OTHER"));
var statusValidator = values_1.v.union(values_1.v.literal("DRAFT"), values_1.v.literal("SUBMITTED"), values_1.v.literal("APPROVED"), values_1.v.literal("REJECTED"), values_1.v.literal("PUBLISHED"));
// ============================================================================
// QUERIES
// ============================================================================
exports.list = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        status: values_1.v.optional(values_1.v.string()),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit, results;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 50;
                    if (!args.status) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("contentDrops")
                            .withIndex("by_status", function (q) { return q.eq("status", args.status); })
                            .order("desc")
                            .take(limit)];
                case 1:
                    results = _b.sent();
                    if (args.projectId) {
                        return [2 /*return*/, results.filter(function (d) { return d.projectId === args.projectId; })];
                    }
                    return [2 /*return*/, results];
                case 2:
                    if (!args.projectId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db
                            .query("contentDrops")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .order("desc")
                            .take(limit)];
                case 3: return [2 /*return*/, _b.sent()];
                case 4: return [4 /*yield*/, ctx.db.query("contentDrops").order("desc").take(limit)];
                case 5: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
exports.get = (0, server_1.query)({
    args: { id: values_1.v.id("contentDrops") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.id)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.listByAgent = (0, server_1.query)({
    args: {
        agentId: values_1.v.id("agents"),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("contentDrops")
                        .withIndex("by_agent", function (q) { return q.eq("agentId", args.agentId); })
                        .order("desc")
                        .take((_a = args.limit) !== null && _a !== void 0 ? _a : 20)];
                case 1: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
exports.submit = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        agentId: values_1.v.optional(values_1.v.id("agents")),
        taskId: values_1.v.optional(values_1.v.id("tasks")),
        title: values_1.v.string(),
        contentType: contentTypeValidator,
        content: values_1.v.string(),
        summary: values_1.v.optional(values_1.v.string()),
        fileUrl: values_1.v.optional(values_1.v.string()),
        tags: values_1.v.optional(values_1.v.array(values_1.v.string())),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var agent, _a, id;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (!args.agentId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db.get(args.agentId)];
                case 1:
                    _a = _e.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = null;
                    _e.label = 3;
                case 3:
                    agent = _a;
                    return [4 /*yield*/, ctx.db.insert("contentDrops", {
                            tenantId: agent === null || agent === void 0 ? void 0 : agent.tenantId,
                            projectId: (_b = args.projectId) !== null && _b !== void 0 ? _b : agent === null || agent === void 0 ? void 0 : agent.projectId,
                            agentId: args.agentId,
                            taskId: args.taskId,
                            title: args.title,
                            contentType: args.contentType,
                            content: args.content,
                            summary: args.summary,
                            fileUrl: args.fileUrl,
                            status: "SUBMITTED",
                            tags: args.tags,
                            metadata: args.metadata,
                        })];
                case 4:
                    id = _e.sent();
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: (_c = args.projectId) !== null && _c !== void 0 ? _c : agent === null || agent === void 0 ? void 0 : agent.projectId,
                            actorType: args.agentId ? "AGENT" : "HUMAN",
                            actorId: (_d = args.agentId) !== null && _d !== void 0 ? _d : undefined,
                            action: "CONTENT_DROP_SUBMITTED",
                            description: "Content drop \"".concat(args.title, "\" submitted").concat(agent ? " by ".concat(agent.name) : ""),
                            targetType: "CONTENT_DROP",
                            targetId: id,
                            agentId: args.agentId,
                        })];
                case 5:
                    _e.sent();
                    return [2 /*return*/, id];
            }
        });
    }); },
});
exports.getStats = (0, server_1.query)({
    args: { projectId: values_1.v.optional(values_1.v.id("projects")) },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var drops, _a, byStatus, byType, _i, drops_1, d;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db.query("contentDrops").withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); }).collect()];
                case 1:
                    _a = _d.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("contentDrops").collect()];
                case 3:
                    _a = _d.sent();
                    _d.label = 4;
                case 4:
                    drops = _a;
                    byStatus = {};
                    byType = {};
                    for (_i = 0, drops_1 = drops; _i < drops_1.length; _i++) {
                        d = drops_1[_i];
                        byStatus[d.status] = ((_b = byStatus[d.status]) !== null && _b !== void 0 ? _b : 0) + 1;
                        byType[d.contentType] = ((_c = byType[d.contentType]) !== null && _c !== void 0 ? _c : 0) + 1;
                    }
                    return [2 /*return*/, { total: drops.length, byStatus: byStatus, byType: byType }];
            }
        });
    }); },
});
exports.seedContentDrops = (0, server_1.mutation)({
    args: { projectId: values_1.v.optional(values_1.v.id("projects")) },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var existing, _a, agents, _b, getAgent, drops, seeded, _i, drops_2, drop, agent;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db.query("contentDrops").withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); }).first()];
                case 1:
                    _a = _c.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("contentDrops").first()];
                case 3:
                    _a = _c.sent();
                    _c.label = 4;
                case 4:
                    existing = _a;
                    if (existing)
                        return [2 /*return*/, { seeded: 0, message: "Already seeded" }];
                    if (!args.projectId) return [3 /*break*/, 6];
                    return [4 /*yield*/, ctx.db.query("agents").withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); }).collect()];
                case 5:
                    _b = _c.sent();
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, ctx.db.query("agents").collect()];
                case 7:
                    _b = _c.sent();
                    _c.label = 8;
                case 8:
                    agents = _b;
                    getAgent = function (name) { return agents.find(function (a) { return a.name.toLowerCase().includes(name.toLowerCase()); }); };
                    drops = [
                        {
                            title: "Mission Control v0.9 — Product Launch Thread",
                            contentType: "SOCIAL_POST",
                            status: "PUBLISHED",
                            summary: "10-tweet thread announcing Mission Control public beta to the AI/dev audience.",
                            content: "1/ We built an AI agent orchestration platform in 90 days. Here's what we learned \uD83E\uDDF5\n\n2/ Agents need a control plane. Not just a chat interface \u2014 a full operational system with approvals, state machines, and observability.\n\n3/ We built Mission Control: real-time Kanban, 8-state task lifecycle, policy-gated approvals, and a multi-agent squad framework.\n\n4/ Every task flows through: INBOX \u2192 ASSIGNED \u2192 IN_PROGRESS \u2192 REVIEW \u2192 NEEDS_APPROVAL \u2192 DONE. No shortcuts.\n\n5/ The hardest part wasn't the AI. It was the operations layer \u2014 rate limiting, idempotency, circuit breakers, audit trails.\n\n6/ Built on Convex (real-time DB + serverless), React + Tailwind, and a custom state machine package.\n\n7/ Agents can claim tasks, post artifacts, request approvals, and trigger standup reports \u2014 all through the same API.\n\n8/ The Telegram bot is the killer feature. Approve tasks, get alerts, and query agent status from your phone.\n\n9/ Open source soon. Follow @jaydubya818 for the drop.\n\n10/ What would you build with a squad of autonomous agents? Reply below \uD83D\uDC47",
                            tags: ["launch", "twitter", "AI", "product"],
                            agentName: "Jordan",
                        },
                        {
                            title: "Why Your AI Agent Needs a State Machine (Not Just a Prompt)",
                            contentType: "BLOG_POST",
                            status: "APPROVED",
                            summary: "Technical deep-dive on why production AI agents require formal state management, with code examples from Mission Control.",
                            content: "# Why Your AI Agent Needs a State Machine\n\n## The Problem With Chaos\n\nMost AI agent implementations are stateless \u2014 the agent receives input, produces output, done. This works fine for demos. It fails catastrophically in production.\n\nWhen an agent can be in any state at any time, bugs compound. A task that was \"in review\" gets re-processed. An approval that was denied gets re-attempted. An agent claims a task that's already done.\n\n## The Solution: 8-State Lifecycle\n\nMission Control enforces every task through a formal state machine:\n\n```\nINBOX \u2192 ASSIGNED \u2192 IN_PROGRESS \u2192 REVIEW \u2192 NEEDS_APPROVAL \u2192 DONE\n                                               \u2198 BLOCKED\n                                               \u2198 CANCELED\n```\n\n## Why This Matters\n\n1. **Idempotency**: Same operation, same result. No duplicate task claims.\n2. **Auditability**: Every transition is logged with actor, timestamp, and reason.\n3. **Policy gates**: Certain transitions (REVIEW \u2192 DONE) require human approval.\n4. **Agent coordination**: Multiple agents can collaborate without stepping on each other.\n\n## Implementation\n\n```typescript\n// packages/state-machine\nexport function validateTransition(from: TaskStatus, to: TaskStatus): boolean {\n  const allowed = TRANSITIONS[from];\n  return allowed?.includes(to) ?? false;\n}\n```\n\nThe key insight: **never let agents transition tasks directly**. All transitions go through the validator, which enforces the rules.\n\n## Conclusion\n\nIf you're building production AI agents, a state machine isn't optional \u2014 it's the foundation everything else rests on.",
                            tags: ["engineering", "ai", "state-machine", "blog"],
                            agentName: "Scribe",
                        },
                        {
                            title: "Weekly Agent Performance Report — Week 12",
                            contentType: "REPORT",
                            status: "SUBMITTED",
                            summary: "Weekly performance metrics across all active agents: task completion rates, approval rates, error frequencies.",
                            content: "# Weekly Agent Performance Report\n**Period:** Week 12, 2026\n\n## Executive Summary\n\nThe squad completed 34 tasks this week (\u219118% vs last week). Approval rate held at 94%. One incident: Jordan's social post flagged for tone review.\n\n## Agent Metrics\n\n| Agent | Tasks Done | Approval Rate | Avg Duration | Errors |\n|-------|-----------|---------------|--------------|--------|\n| Sofie (CAO) | 8 | 100% | 2.3h | 0 |\n| Jordan (Content) | 12 | 91% | 1.8h | 1 |\n| Scout (Research) | 9 | 100% | 3.1h | 0 |\n| Scribe (Docs) | 5 | 100% | 4.2h | 0 |\n\n## Highlights\n\n- **Best performer**: Scout \u2014 9/9 tasks approved on first submission\n- **Most productive**: Jordan \u2014 12 content pieces delivered\n- **Incident**: Jordan's LinkedIn post flagged for competitive brand mention (resolved)\n\n## Recommendations\n\n1. Add brand mention check to Jordan's content policy\n2. Increase Scout's task allocation (high output quality)\n3. Sofie review cadence working well \u2014 maintain current frequency\n\n## Next Week Goals\n\n- 40+ tasks completed\n- Zero policy incidents\n- Launch blog post pipeline",
                            tags: ["report", "metrics", "weekly"],
                            agentName: "Sofie",
                        },
                        {
                            title: "Mission Control × SellerFi Integration — Technical Spec",
                            contentType: "REPORT",
                            status: "DRAFT",
                            summary: "Architecture spec for integrating Mission Control agent squad with SellerFi's ecommerce data pipeline.",
                            content: "# MC \u00D7 SellerFi Integration Spec\n\n## Overview\n\nThis document outlines the technical architecture for deploying a Mission Control agent squad within SellerFi's operational infrastructure.\n\n## Agent Roles\n\n### Data Scout Agent\n- Monitors Shopify/Amazon sales feeds in real-time\n- Surfaces anomalies (sudden drops, SKU stockouts, refund spikes)\n- Posts findings to INBOX as RESEARCH tasks\n\n### Content Agent\n- Generates product descriptions, ad copy, email sequences\n- Pulls from SellerFi brand guidelines and product catalog\n- Submits all outputs as content drops for human review\n\n### Analytics Agent\n- Weekly P&L attribution reports\n- ROAS tracking across ad platforms\n- Forecast modeling using historical data\n\n## Integration Points\n\n```\nSellerFi API \u2192 Convex webhook \u2192 INBOX task creation \u2192 Agent claim \u2192 Deliverable\n```\n\n## Data Flow\n\n1. SellerFi event fires (order, refund, campaign metric)\n2. Convex HTTP endpoint receives webhook\n3. Task created in INBOX with context payload\n4. Assigned agent claims and processes\n5. Deliverable submitted as content drop\n6. Human reviews and approves/rejects\n\n## Timeline\n\n- Week 1: Webhook infrastructure + agent registration\n- Week 2: Data Scout agent live\n- Week 3: Content agent + review workflow\n- Week 4: Analytics agent + dashboard integration",
                            tags: ["integration", "sellerfi", "technical", "spec"],
                            agentName: "Scout",
                        },
                        {
                            title: "5 Prompting Patterns That Cut Agent Error Rates by 40%",
                            contentType: "BLOG_POST",
                            status: "SUBMITTED",
                            summary: "Practical prompting techniques we discovered while building Mission Control that dramatically reduced agent mistakes.",
                            content: "# 5 Prompting Patterns That Cut Agent Error Rates by 40%\n\nAfter running thousands of agent tasks through Mission Control, we identified five prompting patterns that consistently produce better outputs with fewer corrections needed.\n\n## 1. State Injection\n\nAlways inject the current system state into the agent's context. Don't make the agent infer context \u2014 give it facts.\n\n**Before:** \"Write a status update for the project.\"\n**After:** \"The project has 12 DONE tasks, 3 IN_PROGRESS, and 2 BLOCKED. Write a 2-paragraph status update.\"\n\n## 2. Constraint-First Prompting\n\nLead with constraints, not goals. Agents optimize for the goal unless you make constraints explicit.\n\n**Before:** \"Write a tweet about our product launch.\"\n**After:** \"Write a tweet (max 280 chars, no competitor mentions, no emoji except \u2705 and \uD83D\uDE80) about our Mission Control beta launch.\"\n\n## 3. Output Format Specification\n\nAlways specify the exact output format. JSON, Markdown, prose \u2014 be explicit.\n\n## 4. Example-Driven Tasks\n\nProvide one example of a good output. Agents calibrate to examples better than descriptions.\n\n## 5. Failure Mode Enumeration\n\nTell the agent what NOT to do. Enumerating failure modes reduces them.\n\n## Results\n\nAfter implementing all five patterns across our squad: approval-on-first-submission rate went from 61% to 94%.",
                            tags: ["prompting", "ai", "engineering", "blog"],
                            agentName: "Scribe",
                        },
                        {
                            title: "LinkedIn Carousel: Building With AI Agents in 2026",
                            contentType: "SOCIAL_POST",
                            status: "REJECTED",
                            summary: "7-slide LinkedIn carousel on building production AI agent systems. Rejected: competitive brand mention on slide 3.",
                            content: "Slide 1: Building with AI Agents in 2026 \u2014 What Actually Works\n\nSlide 2: Everyone's building chatbots. Smart operators are building agent squads.\n\nSlide 3: [FLAGGED] Unlike OpenAI's Operator product, Mission Control gives you full control over every agent decision.\n\nSlide 4: The key insight: agents need operations infrastructure, not just good prompts.\n\nSlide 5: State machines. Approval gates. Budget controls. Audit trails. That's the real stack.\n\nSlide 6: We're running 4 agents simultaneously. Zero incidents. 94% first-submission approval rate.\n\nSlide 7: What would you build? Drop your answer below \uD83D\uDC47",
                            tags: ["linkedin", "carousel", "ai"],
                            agentName: "Jordan",
                        },
                        {
                            title: "Telegram Bot Setup Guide — Internal Ops Manual",
                            contentType: "REPORT",
                            status: "PUBLISHED",
                            summary: "Step-by-step guide for configuring the Mission Control Telegram bot for agent notifications and approvals.",
                            content: "# Telegram Bot Setup Guide\n\n## Prerequisites\n\n- Mission Control deployed to Convex\n- Telegram account\n- BotFather access\n\n## Step 1: Create Bot\n\n1. Open Telegram, search @BotFather\n2. Send /newbot\n3. Name: \"Mission Control Bot\"\n4. Username: @missioncontrol_ops_bot\n5. Copy the API token\n\n## Step 2: Configure Convex\n\nIn your Convex dashboard, set environment variables:\n```\nTELEGRAM_BOT_TOKEN=your_token_here\nTELEGRAM_CHAT_ID=your_chat_id\n```\n\n## Step 3: Set Webhook\n\n```bash\ncurl -X POST https://api.telegram.org/bot{TOKEN}/setWebhook \\\n  -d \"url=https://your-convex-url.convex.site/telegram\"\n```\n\n## Commands\n\n- /status \u2014 Current agent status\n- /approve {id} \u2014 Approve pending task\n- /deny {id} \u2014 Deny pending task\n- /tasks \u2014 List INBOX tasks\n- /standup \u2014 Generate squad standup\n\n## Notifications\n\nThe bot will automatically notify you when:\n- Task requires approval (NEEDS_APPROVAL)\n- Agent reports an error\n- Budget threshold exceeded\n- Daily standup ready",
                            tags: ["telegram", "setup", "ops", "guide"],
                            agentName: "Scribe",
                        },
                        {
                            title: "Cold Email Sequence: AI Operations Platform (5-Email Series)",
                            contentType: "EMAIL_DRAFT",
                            status: "APPROVED",
                            summary: "5-email cold outreach sequence targeting CTOs and Head of Engineering at Series A-C startups.",
                            content: "Email 1 \u2014 Day 0 (Initial Outreach)\nSubject: your engineering team + AI agents\n\nHi {{first_name}},\n\nQuick question: does your team spend more than 2 hours/week on repetitive ops tasks?\n\nWe built Mission Control for exactly this. It's a control plane for autonomous AI agent squads \u2014 not another chatbot, but full operational infrastructure with approval workflows, state machines, and real-time observability.\n\nWorth a 20-min call?\n\n---\nEmail 2 \u2014 Day 3 (Social Proof)\nSubject: 34 tasks/week, zero incidents\n\nFollowing up \u2014 wanted to share a quick win.\n\nOur squad completed 34 autonomous tasks last week with a 94% first-pass approval rate and zero policy incidents. That's 4 agents running in parallel, each with scoped permissions and budget controls.\n\nHappy to walk you through the architecture.\n\n---\nEmail 3 \u2014 Day 7 (Use Case)\nSubject: the use case that always resonates\n\nMost CTOs I talk to immediately see this use case:\n\nAgent monitors your Slack/Linear/Jira \u2192 surfaces blockers \u2192 drafts updates \u2192 requests approval \u2192 posts to stakeholders.\n\nNo more status meeting prep. No more manual reporting.\n\n---\nEmail 4 \u2014 Day 14 (Technical)\nSubject: re: the state machine question\n\nA few people have asked how we handle agent coordination without conflicts.\n\nShort answer: 8-state lifecycle + idempotency keys. Every task transition is validated, logged, and gated. Agents can't step on each other.\n\n---\nEmail 5 \u2014 Day 21 (Breakup)\nSubject: closing the loop\n\nHi {{first_name}}, closing the loop on this.\n\nIf the timing's off, no worries \u2014 I'll check back in Q3. If you're actively exploring AI ops infrastructure, happy to do a quick demo.\n\nEither way, best of luck with {{company}}.",
                            tags: ["email", "outreach", "sales"],
                            agentName: "Jordan",
                        },
                    ];
                    seeded = 0;
                    _i = 0, drops_2 = drops;
                    _c.label = 9;
                case 9:
                    if (!(_i < drops_2.length)) return [3 /*break*/, 12];
                    drop = drops_2[_i];
                    agent = drop.agentName ? getAgent(drop.agentName) : null;
                    return [4 /*yield*/, ctx.db.insert("contentDrops", {
                            projectId: args.projectId,
                            agentId: agent === null || agent === void 0 ? void 0 : agent._id,
                            title: drop.title,
                            contentType: drop.contentType,
                            content: drop.content,
                            summary: drop.summary,
                            status: drop.status,
                            tags: drop.tags,
                            reviewedBy: ["APPROVED", "REJECTED", "PUBLISHED"].includes(drop.status) ? "operator" : undefined,
                            reviewedAt: ["APPROVED", "REJECTED", "PUBLISHED"].includes(drop.status) ? Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000 : undefined,
                            reviewNote: drop.status === "REJECTED" ? "Contains competitive brand mention — please revise slide 3." : undefined,
                        })];
                case 10:
                    _c.sent();
                    seeded++;
                    _c.label = 11;
                case 11:
                    _i++;
                    return [3 /*break*/, 9];
                case 12: return [2 /*return*/, { seeded: seeded }];
            }
        });
    }); },
});
exports.updateStatus = (0, server_1.mutation)({
    args: {
        id: values_1.v.id("contentDrops"),
        status: statusValidator,
        reviewedBy: values_1.v.optional(values_1.v.string()),
        reviewNote: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var drop;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.id)];
                case 1:
                    drop = _a.sent();
                    if (!drop)
                        throw new Error("Content drop not found");
                    return [4 /*yield*/, ctx.db.patch(args.id, {
                            status: args.status,
                            reviewedBy: args.reviewedBy,
                            reviewedAt: Date.now(),
                            reviewNote: args.reviewNote,
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: drop.projectId,
                            actorType: "HUMAN",
                            actorId: args.reviewedBy,
                            action: "CONTENT_DROP_".concat(args.status),
                            description: "Content drop \"".concat(drop.title, "\" marked as ").concat(args.status.toLowerCase()),
                            targetType: "CONTENT_DROP",
                            targetId: args.id,
                            agentId: drop.agentId,
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, ctx.db.get(args.id)];
                case 4: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});

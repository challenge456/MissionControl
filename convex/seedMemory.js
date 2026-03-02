"use strict";
/**
 * Seed Memory Data — session docs, patterns, agent memories, knowledge base
 * Run: npx convex run seedMemory:run
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
exports.run = void 0;
var server_1 = require("./_generated/server");
exports.run = (0, server_1.mutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var project, projectId, agents, now, hour, day, sessionDocs, _i, sessionDocs_1, doc, workingDocs, _a, workingDocs_1, doc, dailyNotes, _b, dailyNotes_1, doc, patterns, _c, patterns_1, p;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("projects")
                        .withIndex("by_slug", function (q) { return q.eq("slug", "mission-control"); })
                        .first()];
                case 1:
                    project = _d.sent();
                    if (!!project) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db.query("projects").first()];
                case 2:
                    project = _d.sent();
                    _d.label = 3;
                case 3:
                    if (!project) {
                        return [2 /*return*/, { error: "No project found. Run seed first." }];
                    }
                    projectId = project._id;
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_project", function (q) { return q.eq("projectId", projectId); })
                            .collect()];
                case 4:
                    agents = _d.sent();
                    if (!(agents.length === 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, ctx.db.query("agents").take(6)];
                case 5:
                    agents = _d.sent();
                    _d.label = 6;
                case 6:
                    if (agents.length === 0) {
                        return [2 /*return*/, { error: "No agents found. Run seed first." }];
                    }
                    now = Date.now();
                    hour = 3600000;
                    day = 86400000;
                    sessionDocs = [
                        {
                            agentId: agents[0]._id,
                            projectId: projectId,
                            type: "SESSION_MEMORY",
                            content: "Completed initial research on competitor pricing models. Found 3 key patterns:\n1. Tiered pricing with usage caps\n2. Per-seat licensing for enterprise\n3. Freemium with feature gates\n\nRecommend hybrid approach for SellerFi.",
                            updatedAt: now - 2 * hour,
                        },
                        {
                            agentId: agents[Math.min(1, agents.length - 1)]._id,
                            projectId: projectId,
                            type: "SESSION_MEMORY",
                            content: "Drafted 3 blog post outlines for the content calendar:\n- \"5 Signs You're Ready for Seller Financing\"\n- \"How AI is Changing Small Business Lending\"\n- \"Seller Financing vs Traditional Bank Loans: A Comparison\"\n\nFirst draft of post #1 is in progress.",
                            updatedAt: now - 45 * 60000,
                        },
                        {
                            agentId: agents[Math.min(2, agents.length - 1)]._id,
                            projectId: projectId,
                            type: "SESSION_MEMORY",
                            content: "Reviewed PR #47 — authentication refactor. Found 2 issues:\n1. JWT refresh token rotation not implemented\n2. Missing rate limiting on login endpoint\n\nLeft detailed comments. Waiting for author to address.",
                            updatedAt: now - 15 * 60000,
                        },
                    ];
                    _i = 0, sessionDocs_1 = sessionDocs;
                    _d.label = 7;
                case 7:
                    if (!(_i < sessionDocs_1.length)) return [3 /*break*/, 10];
                    doc = sessionDocs_1[_i];
                    return [4 /*yield*/, ctx.db.insert("agentDocuments", doc)];
                case 8:
                    _d.sent();
                    _d.label = 9;
                case 9:
                    _i++;
                    return [3 /*break*/, 7];
                case 10:
                    workingDocs = [
                        {
                            agentId: agents[0]._id,
                            projectId: projectId,
                            type: "WORKING_MD",
                            content: "# Current Focus\n\n## Active Work\n- Market research for Q1 strategy\n- Competitive analysis document\n- Pricing model recommendations\n\n## Blockers\n- Waiting on financial data from finance team\n\n## Notes\n- Meeting with stakeholders scheduled for Thursday\n- Need to align pricing with brand positioning",
                            updatedAt: now - 6 * hour,
                        },
                        {
                            agentId: agents[Math.min(1, agents.length - 1)]._id,
                            projectId: projectId,
                            type: "WORKING_MD",
                            content: "# Content Pipeline\n\n## Published This Week\n- LinkedIn post: AI in Finance (342 impressions)\n- Blog: Getting Started Guide (89 views)\n\n## In Progress\n- Email sequence for onboarding flow (3/5 emails done)\n- Social media calendar for February\n\n## Ideas Backlog\n- Video explainer for seller financing\n- Case study with early adopter",
                            updatedAt: now - 3 * hour,
                        },
                        {
                            agentId: agents[Math.min(3, agents.length - 1)]._id,
                            projectId: projectId,
                            type: "WORKING_MD",
                            content: "# Engineering Log\n\n## Recent Changes\n- Migrated auth to Clerk (PR #42)\n- Added Stripe webhook handlers\n- Fixed N+1 query in dashboard loader\n\n## Tech Debt\n- Need to add integration tests for payment flow\n- Refactor notification service to use queue\n- Database indexes for search queries\n\n## Architecture Decisions\n- Chose Convex over Supabase for real-time features\n- Using Edge Functions for webhook processing",
                            updatedAt: now - 1 * hour,
                        },
                    ];
                    _a = 0, workingDocs_1 = workingDocs;
                    _d.label = 11;
                case 11:
                    if (!(_a < workingDocs_1.length)) return [3 /*break*/, 14];
                    doc = workingDocs_1[_a];
                    return [4 /*yield*/, ctx.db.insert("agentDocuments", doc)];
                case 12:
                    _d.sent();
                    _d.label = 13;
                case 13:
                    _a++;
                    return [3 /*break*/, 11];
                case 14:
                    dailyNotes = [
                        {
                            agentId: agents[0]._id,
                            projectId: projectId,
                            type: "DAILY_NOTE",
                            content: "Feb 7: Completed competitor analysis for 5 platforms. Key takeaway — most competitors lack AI-driven risk assessment. This is our differentiator.\n\nTomorrow: Start drafting the pricing recommendation doc.",
                            updatedAt: now - 1 * day,
                        },
                        {
                            agentId: agents[Math.min(1, agents.length - 1)]._id,
                            projectId: projectId,
                            type: "DAILY_NOTE",
                            content: "Feb 8: Published the onboarding email sequence. Open rate projections: 35-40% based on industry benchmarks.\n\nScheduled 4 social posts for next week. Need approval on the LinkedIn ad copy.",
                            updatedAt: now - 2 * hour,
                        },
                        {
                            agentId: agents[Math.min(2, agents.length - 1)]._id,
                            projectId: projectId,
                            type: "DAILY_NOTE",
                            content: "Feb 8: Reviewed 3 PRs today. Code quality is improving — fewer linting issues and better test coverage.\n\nNoticed a potential security issue in the file upload handler. Created a YELLOW risk ticket.",
                            updatedAt: now - 4 * hour,
                        },
                        {
                            agentId: agents[Math.min(3, agents.length - 1)]._id,
                            projectId: projectId,
                            type: "DAILY_NOTE",
                            content: "Feb 7: Deployed hotfix for the payment calculation rounding error. All tests passing. Monitoring for 24h before closing the incident.\n\nStarted spike on WebSocket integration for real-time notifications.",
                            updatedAt: now - 1 * day + 8 * hour,
                        },
                    ];
                    _b = 0, dailyNotes_1 = dailyNotes;
                    _d.label = 15;
                case 15:
                    if (!(_b < dailyNotes_1.length)) return [3 /*break*/, 18];
                    doc = dailyNotes_1[_b];
                    return [4 /*yield*/, ctx.db.insert("agentDocuments", doc)];
                case 16:
                    _d.sent();
                    _d.label = 17;
                case 17:
                    _b++;
                    return [3 /*break*/, 15];
                case 18:
                    patterns = [
                        {
                            agentId: agents[0]._id,
                            projectId: projectId,
                            pattern: "strength:market-research",
                            confidence: 0.92,
                            evidence: [
                                "Completed competitor analysis in 2 hours",
                                "Identified 3 pricing strategies",
                                "Accurate market size estimates",
                            ],
                            discoveredAt: now - 5 * day,
                            lastSeenAt: now - 2 * hour,
                        },
                        {
                            agentId: agents[Math.min(1, agents.length - 1)]._id,
                            projectId: projectId,
                            pattern: "strength:content-writing",
                            confidence: 0.87,
                            evidence: [
                                "Blog posts consistently above 80 readability score",
                                "Email sequences with 38% open rate",
                                "Social posts with above-average engagement",
                            ],
                            discoveredAt: now - 10 * day,
                            lastSeenAt: now - 1 * day,
                        },
                        {
                            agentId: agents[Math.min(2, agents.length - 1)]._id,
                            projectId: projectId,
                            pattern: "strength:code-review",
                            confidence: 0.85,
                            evidence: [
                                "Caught security vulnerability in PR #47",
                                "Identified N+1 query pattern",
                                "Consistent review turnaround under 30 min",
                            ],
                            discoveredAt: now - 7 * day,
                            lastSeenAt: now - 4 * hour,
                        },
                        {
                            agentId: agents[0]._id,
                            projectId: projectId,
                            pattern: "weakness:technical-implementation",
                            confidence: 0.45,
                            evidence: [
                                "Required 3 iterations on API integration task",
                                "Missed edge case in data validation",
                            ],
                            discoveredAt: now - 3 * day,
                            lastSeenAt: now - 1 * day,
                        },
                        {
                            agentId: agents[Math.min(1, agents.length - 1)]._id,
                            projectId: projectId,
                            pattern: "preference:morning-productivity",
                            confidence: 0.78,
                            evidence: [
                                "80% of high-quality outputs produced before noon",
                                "Task completion rate 40% higher in AM sessions",
                            ],
                            discoveredAt: now - 14 * day,
                            lastSeenAt: now - 2 * day,
                        },
                        {
                            agentId: agents[Math.min(3, agents.length - 1)]._id,
                            projectId: projectId,
                            pattern: "strength:debugging",
                            confidence: 0.91,
                            evidence: [
                                "Resolved payment rounding bug in 15 minutes",
                                "Traced WebSocket connection leak to root cause",
                                "Fixed race condition in task queue processor",
                                "Identified memory leak in long-running process",
                            ],
                            discoveredAt: now - 12 * day,
                            lastSeenAt: now - 6 * hour,
                        },
                    ];
                    _c = 0, patterns_1 = patterns;
                    _d.label = 19;
                case 19:
                    if (!(_c < patterns_1.length)) return [3 /*break*/, 22];
                    p = patterns_1[_c];
                    return [4 /*yield*/, ctx.db.insert("agentPatterns", p)];
                case 20:
                    _d.sent();
                    _d.label = 21;
                case 21:
                    _c++;
                    return [3 /*break*/, 19];
                case 22: return [2 /*return*/, {
                        success: true,
                        project: project.name,
                        seeded: {
                            sessionMemories: sessionDocs.length,
                            workingDocs: workingDocs.length,
                            dailyNotes: dailyNotes.length,
                            patterns: patterns.length,
                        },
                    }];
            }
        });
    }); },
});

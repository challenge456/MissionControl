"use strict";
/**
 * Seed Data — V0
 *
 * Creates sample agents and tasks for testing.
 * Run with: npx convex run seed:seedV0
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.seedCouncilData = exports.activateAgentsForDemo = exports.getSeededStatus = exports.backfillSofieDocs = exports.clearAll = exports.backfillBJDocs = exports.seedV0 = void 0;
var server_1 = require("./_generated/server");
exports.seedV0 = (0, server_1.mutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var existingAgents, projectId, agentConfigs, agentIds, _i, agentConfigs_1, config, agentId, sofieId, now, taskConfigs, taskIds, _a, taskConfigs_1, config, assigneeIds, reviewerId, taskId, inProgressTask, reviewTask;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, ctx.db.query("agents").take(1)];
                case 1:
                    existingAgents = _c.sent();
                    if (existingAgents.length > 0) {
                        return [2 /*return*/, { message: "Already seeded", skipped: true }];
                    }
                    return [4 /*yield*/, ctx.db.insert("projects", {
                            name: "OpenClaw",
                            slug: "openclaw",
                            description: "Default project for OpenClaw autonomous agents.",
                            policyDefaults: {
                                budgetDefaults: {
                                    INTERN: { daily: 2.00, perRun: 0.25 },
                                    SPECIALIST: { daily: 5.00, perRun: 0.75 },
                                    LEAD: { daily: 12.00, perRun: 1.50 },
                                },
                            },
                        })];
                case 2:
                    projectId = _c.sent();
                    // Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: projectId,
                            actorType: "SYSTEM",
                            action: "PROJECT_CREATED",
                            description: "Default project \"OpenClaw\" created",
                            targetType: "PROJECT",
                            targetId: projectId,
                        })];
                case 3:
                    // Log activity
                    _c.sent();
                    agentConfigs = [
                        // SOFIE - Chief Agent Officer (CAO) - Top-level orchestrator
                        {
                            name: "Sofie",
                            emoji: "🎯",
                            role: "LEAD",
                            allowedTaskTypes: ["STRATEGIC", "OPS", "CONTENT", "ENGINEERING", "DOCS", "SOCIAL", "CUSTOMER_RESEARCH", "EMAIL_MARKETING"],
                            budgetDaily: 12.00,
                            budgetPerRun: 1.50,
                            canSpawn: true,
                            maxSubAgents: 4,
                            isCAO: true,
                        },
                        // PERRY - Chief Operating Officer (COO) - Operations lead for SellerFi
                        {
                            name: "Perry",
                            emoji: "📊",
                            role: "LEAD",
                            allowedTaskTypes: ["OPS", "STRATEGIC", "DOCS", "CUSTOMER_RESEARCH"],
                            budgetDaily: 12.00,
                            budgetPerRun: 1.50,
                            canSpawn: true,
                            maxSubAgents: 3,
                        },
                        // SELLERFI - Developer/Programmer - SellerFi platform development
                        {
                            name: "SellerFi",
                            emoji: "⚡",
                            role: "SPECIALIST",
                            allowedTaskTypes: ["ENGINEERING", "DOCS", "OPS"],
                            budgetDaily: 5.00,
                            budgetPerRun: 0.75,
                            canSpawn: true,
                            maxSubAgents: 2,
                        },
                        // COACH - Fitness & Productivity (Telegram Bot)
                        {
                            name: "Coach",
                            emoji: "🏋️",
                            role: "SPECIALIST",
                            allowedTaskTypes: ["OPS", "CONTENT", "CUSTOMER_RESEARCH"],
                            budgetDaily: 5.00,
                            budgetPerRun: 0.75,
                            canSpawn: true,
                            maxSubAgents: 2,
                        },
                        // CASEY - Operations & Documentation (Telegram Bot)
                        {
                            name: "Casey",
                            emoji: "📋",
                            role: "SPECIALIST",
                            allowedTaskTypes: ["DOCS", "OPS", "CONTENT"],
                            budgetDaily: 5.00,
                            budgetPerRun: 0.75,
                            canSpawn: true,
                            maxSubAgents: 2,
                        },
                        // ALEX - Engineering & Development (Telegram Bot)
                        {
                            name: "Alex",
                            emoji: "💻",
                            role: "SPECIALIST",
                            allowedTaskTypes: ["ENGINEERING", "DOCS"],
                            budgetDaily: 5.00,
                            budgetPerRun: 0.75,
                            canSpawn: true,
                            maxSubAgents: 2,
                        },
                        // JORDAN - Media & Creative (Telegram Bot)
                        {
                            name: "Jordan",
                            emoji: "🎧",
                            role: "SPECIALIST",
                            allowedTaskTypes: ["SOCIAL", "CONTENT", "EMAIL_MARKETING"],
                            budgetDaily: 5.00,
                            budgetPerRun: 0.75,
                            canSpawn: true,
                            maxSubAgents: 2,
                        },
                        // SCOUT - Customer Research & SEO (INTERN)
                        {
                            name: "Scout",
                            emoji: "🔍",
                            role: "INTERN",
                            allowedTaskTypes: ["CUSTOMER_RESEARCH", "CONTENT"],
                            budgetDaily: 2.00,
                            budgetPerRun: 0.25,
                            canSpawn: false,
                            maxSubAgents: 0,
                        },
                        // SCRIBE - Documentation & Content (INTERN)
                        {
                            name: "Scribe",
                            emoji: "✍️",
                            role: "INTERN",
                            allowedTaskTypes: ["DOCS", "CONTENT"],
                            budgetDaily: 2.00,
                            budgetPerRun: 0.25,
                            canSpawn: false,
                            maxSubAgents: 0,
                        },
                        // PIXEL - Social Media & Content (INTERN)
                        {
                            name: "Pixel",
                            emoji: "🎨",
                            role: "INTERN",
                            allowedTaskTypes: ["SOCIAL", "CONTENT"],
                            budgetDaily: 2.00,
                            budgetPerRun: 0.25,
                            canSpawn: false,
                            maxSubAgents: 0,
                        },
                        // CHIP - Engineering & Docs (INTERN)
                        {
                            name: "Chip",
                            emoji: "🔧",
                            role: "INTERN",
                            allowedTaskTypes: ["ENGINEERING", "DOCS"],
                            budgetDaily: 2.00,
                            budgetPerRun: 0.25,
                            canSpawn: false,
                            maxSubAgents: 0,
                        },
                    ];
                    agentIds = {};
                    _i = 0, agentConfigs_1 = agentConfigs;
                    _c.label = 4;
                case 4:
                    if (!(_i < agentConfigs_1.length)) return [3 /*break*/, 7];
                    config = agentConfigs_1[_i];
                    return [4 /*yield*/, ctx.db.insert("agents", {
                            projectId: projectId,
                            name: config.name,
                            emoji: config.emoji,
                            role: config.role,
                            status: "ACTIVE",
                            workspacePath: "~/.openclaw/agents/".concat(config.name.toLowerCase()),
                            allowedTaskTypes: config.allowedTaskTypes,
                            budgetDaily: config.budgetDaily,
                            budgetPerRun: config.budgetPerRun,
                            spendToday: 0,
                            canSpawn: config.canSpawn,
                            maxSubAgents: (_b = config.maxSubAgents) !== null && _b !== void 0 ? _b : 0,
                            errorStreak: 0,
                            lastHeartbeatAt: Date.now(),
                            soulVersionHash: config.isCAO ? "sha256-a1b2c3d4e5f6" : undefined,
                            metadata: config.isCAO
                                ? {
                                    isCAO: true,
                                    role: "Chief Agent Officer",
                                    telegram: "@sofie_cao_bot",
                                    discord: "Sofie#0001",
                                    model: "Claude Opus 4",
                                    systemPrompt: "You are Sofie, the Chief Agent Officer (CAO) for Mission Control. You oversee all agent operations, delegate strategic work, monitor agent health and budgets, resolve conflicts, and escalate to humans when needed. You do NOT execute domain work directly.",
                                }
                                : undefined,
                        })];
                case 5:
                    agentId = _c.sent();
                    agentIds[config.name] = agentId;
                    _c.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7:
                    sofieId = agentIds["Sofie"];
                    if (!sofieId) return [3 /*break*/, 11];
                    now = Date.now();
                    // WORKING.md — Sofie's active working memory
                    return [4 /*yield*/, ctx.db.insert("agentDocuments", {
                            agentId: sofieId,
                            type: "WORKING_MD",
                            content: "# Sofie \u2014 Working Document\n\n## Current Priorities\n1. Monitor all agent health and error streaks\n2. Ensure daily budgets are being respected\n3. Delegate incoming INBOX tasks to appropriate specialists\n4. Review tasks in REVIEW status for quality\n\n## Active Delegations\n| Task | Assigned To | Status | Notes |\n|------|-------------|--------|-------|\n| API Docs Update | Casey | IN_PROGRESS | On track |\n| Social Campaign | Jordan | REVIEW | Needs final check |\n| Competitor Research | Scout | INBOX | Unassigned, will delegate |\n\n## Agent Health Summary\n- **Perry** (COO): ACTIVE, healthy, 0 errors\n- **SellerFi**: ACTIVE, healthy, 0 errors\n- **Coach**: ACTIVE, healthy, 0 errors\n- **Casey**: ACTIVE, working on docs, 0 errors\n- **Alex**: ACTIVE, healthy, 0 errors\n- **Jordan**: ACTIVE, content work, 0 errors\n- **Scout**: ACTIVE, available for research, 0 errors\n- **Scribe**: ACTIVE, available, 0 errors\n- **Pixel**: ACTIVE, available, 0 errors\n- **Chip**: ACTIVE, available, 0 errors\n\n## Notes\n- Next strategic review scheduled for end of sprint\n- Consider spawning a sub-agent for the email marketing backlog\n",
                            updatedAt: now,
                            metadata: { version: 1 },
                        })];
                case 8:
                    // WORKING.md — Sofie's active working memory
                    _c.sent();
                    // Daily Note
                    return [4 /*yield*/, ctx.db.insert("agentDocuments", {
                            agentId: sofieId,
                            type: "DAILY_NOTE",
                            content: "# Daily Note \u2014 ".concat(new Date().toISOString().split("T")[0], "\n\n## Morning Review\n- All 10 agents reporting ACTIVE status\n- No error streaks detected\n- Budget utilization: 15% of daily across all agents\n- 3 tasks in INBOX awaiting delegation\n\n## Actions Taken\n- Reviewed Casey's API documentation progress \u2014 on track\n- Checked Jordan's social campaign submission \u2014 in REVIEW\n- Identified competitor research task for Scout delegation\n\n## Escalations\n- None today\n\n## End of Day Summary\n- Pending: will update at EOD\n"),
                            updatedAt: now,
                            metadata: { date: new Date().toISOString().split("T")[0] },
                        })];
                case 9:
                    // Daily Note
                    _c.sent();
                    // Session Memory
                    return [4 /*yield*/, ctx.db.insert("agentDocuments", {
                            agentId: sofieId,
                            type: "SESSION_MEMORY",
                            content: "# Session Memory \u2014 Sofie\n\n## Context\n- Project: OpenClaw\n- Role: CAO (Chief Agent Officer)\n- Reporting to: Human CHO (Chief Human Officer)\n\n## Last Session Summary\n- Delegated 2 tasks to specialists\n- Resolved a resource conflict between Casey and Scribe (both wanted the docs repo)\n- Approved Perry's operational plan for the week\n\n## Persistent State\n- Preferred delegation strategy: capability-first, then capacity\n- Current sprint focus: content pipeline + API documentation\n- Risk level: GREEN across all agents\n",
                            updatedAt: now,
                            metadata: { sessionId: "session-001" },
                        })];
                case 10:
                    // Session Memory
                    _c.sent();
                    _c.label = 11;
                case 11:
                    taskConfigs = [
                        // INBOX
                        {
                            title: "Research competitor pricing strategies",
                            description: "Analyze top 5 competitors' pricing pages and subscription tiers. Create comparison matrix.",
                            type: "CUSTOMER_RESEARCH",
                            status: "INBOX",
                            priority: 3,
                            labels: ["research", "competitive-analysis"],
                        },
                        // ASSIGNED
                        {
                            title: "Write blog post about AI automation",
                            description: "1500-word blog post on how AI agents are transforming business operations.",
                            type: "CONTENT",
                            status: "ASSIGNED",
                            priority: 2,
                            assigneeNames: ["Jordan"],
                            labels: ["content", "blog"],
                        },
                        // IN_PROGRESS
                        {
                            title: "Update API documentation",
                            description: "Review and update REST API docs. Add examples for new endpoints.",
                            type: "DOCS",
                            status: "IN_PROGRESS",
                            priority: 2,
                            assigneeNames: ["Casey"],
                            workPlan: {
                                bullets: [
                                    "Audit existing API docs for outdated information",
                                    "Document new /agents and /tasks endpoints",
                                    "Add curl examples for each endpoint",
                                    "Update authentication section",
                                ],
                            },
                            labels: ["docs", "api"],
                        },
                        // REVIEW
                        {
                            title: "Design social media campaign",
                            description: "Create 10 social media posts for product launch. Include copy and image prompts.",
                            type: "SOCIAL",
                            status: "REVIEW",
                            priority: 2,
                            assigneeNames: ["Jordan"],
                            reviewerName: "Coach",
                            workPlan: {
                                bullets: [
                                    "Research trending formats on Twitter/LinkedIn",
                                    "Draft 10 post variations",
                                    "Create image prompts for each post",
                                    "Schedule content calendar",
                                ],
                            },
                            deliverable: {
                                summary: "10 social media posts ready for launch week",
                                artifactIds: ["posts-draft.md", "image-prompts.md"],
                            },
                            labels: ["social", "launch"],
                        },
                        // NEEDS_APPROVAL
                        {
                            title: "Set up automated email sequences",
                            description: "Configure 5-email onboarding sequence for new users.",
                            type: "EMAIL_MARKETING",
                            status: "NEEDS_APPROVAL",
                            priority: 1,
                            assigneeNames: ["Jordan"],
                            labels: ["email", "automation", "high-priority"],
                        },
                        // BLOCKED
                        {
                            title: "Integrate payment provider",
                            description: "Add Stripe integration for subscription billing.",
                            type: "ENGINEERING",
                            status: "BLOCKED",
                            priority: 1,
                            assigneeNames: ["Alex"],
                            blockedReason: "Waiting for Stripe API keys from finance team",
                            labels: ["engineering", "payments", "blocked"],
                        },
                        // DONE
                        {
                            title: "Create onboarding checklist",
                            description: "Design step-by-step onboarding flow for new users.",
                            type: "OPS",
                            status: "DONE",
                            priority: 3,
                            assigneeNames: ["Casey"],
                            completedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
                            labels: ["ops", "onboarding"],
                        },
                        // CANCELED
                        {
                            title: "Build custom analytics dashboard",
                            description: "Create real-time analytics dashboard. [Canceled: Using existing tool instead]",
                            type: "ENGINEERING",
                            status: "CANCELED",
                            priority: 4,
                            labels: ["engineering", "canceled"],
                        },
                    ];
                    taskIds = [];
                    _a = 0, taskConfigs_1 = taskConfigs;
                    _c.label = 12;
                case 12:
                    if (!(_a < taskConfigs_1.length)) return [3 /*break*/, 16];
                    config = taskConfigs_1[_a];
                    assigneeIds = (config.assigneeNames || [])
                        .map(function (name) { return agentIds[name]; })
                        .filter(Boolean);
                    reviewerId = config.reviewerName ? agentIds[config.reviewerName] : undefined;
                    return [4 /*yield*/, ctx.db.insert("tasks", {
                            projectId: projectId,
                            title: config.title,
                            description: config.description,
                            type: config.type,
                            status: config.status,
                            priority: config.priority,
                            assigneeIds: assigneeIds,
                            reviewerId: reviewerId,
                            workPlan: config.workPlan,
                            deliverable: config.deliverable,
                            blockedReason: config.blockedReason,
                            reviewCycles: config.status === "REVIEW" ? 1 : 0,
                            actualCost: 0,
                            completedAt: config.completedAt,
                            startedAt: ["IN_PROGRESS", "REVIEW", "BLOCKED", "DONE", "NEEDS_APPROVAL"].includes(config.status)
                                ? Date.now() - 3 * 24 * 60 * 60 * 1000
                                : undefined,
                            labels: config.labels,
                        })];
                case 13:
                    taskId = _c.sent();
                    taskIds.push({ id: taskId, status: config.status });
                    // Create initial transition
                    return [4 /*yield*/, ctx.db.insert("taskTransitions", {
                            projectId: projectId,
                            idempotencyKey: "seed:".concat(taskId, ":initial"),
                            taskId: taskId,
                            fromStatus: "INBOX",
                            toStatus: config.status,
                            actorType: "SYSTEM",
                            reason: "Seeded for V0 demo",
                        })];
                case 14:
                    // Create initial transition
                    _c.sent();
                    _c.label = 15;
                case 15:
                    _a++;
                    return [3 /*break*/, 12];
                case 16:
                    inProgressTask = taskIds.find(function (t) { return t.status === "IN_PROGRESS"; });
                    if (!inProgressTask) return [3 /*break*/, 19];
                    return [4 /*yield*/, ctx.db.insert("messages", {
                            projectId: projectId,
                            taskId: inProgressTask.id,
                            authorType: "AGENT",
                            authorAgentId: agentIds["Casey"],
                            type: "WORK_PLAN",
                            content: "## Work Plan\n\n1. Audit existing API docs for outdated information\n2. Document new /agents and /tasks endpoints\n3. Add curl examples for each endpoint\n4. Update authentication section\n\n**Estimated Duration:** 4 hours",
                        })];
                case 17:
                    _c.sent();
                    return [4 /*yield*/, ctx.db.insert("messages", {
                            projectId: projectId,
                            taskId: inProgressTask.id,
                            authorType: "AGENT",
                            authorAgentId: agentIds["Casey"],
                            type: "PROGRESS",
                            content: "**Progress: 40%**\n\nCompleted audit of existing docs. Found 3 deprecated endpoints and 2 missing new ones. Starting documentation of /agents endpoint now.",
                        })];
                case 18:
                    _c.sent();
                    _c.label = 19;
                case 19:
                    reviewTask = taskIds.find(function (t) { return t.status === "REVIEW"; });
                    if (!reviewTask) return [3 /*break*/, 22];
                    return [4 /*yield*/, ctx.db.insert("messages", {
                            projectId: projectId,
                            taskId: reviewTask.id,
                            authorType: "AGENT",
                            authorAgentId: agentIds["Jordan"],
                            type: "ARTIFACT",
                            content: "## Deliverable: Social Media Campaign\n\nAttached 10 posts with copy and image prompts. Ready for review.",
                            artifacts: [
                                { name: "posts-draft.md", type: "text/markdown" },
                                { name: "image-prompts.md", type: "text/markdown" },
                            ],
                        })];
                case 20:
                    _c.sent();
                    return [4 /*yield*/, ctx.db.insert("messages", {
                            projectId: projectId,
                            taskId: reviewTask.id,
                            authorType: "HUMAN",
                            authorUserId: "jay",
                            type: "COMMENT",
                            content: "Looking good! Can we add more variety to the image styles? Some feel repetitive.",
                        })];
                case 21:
                    _c.sent();
                    _c.label = 22;
                case 22: 
                // =========================================================================
                // DEFAULT POLICY
                // =========================================================================
                return [4 /*yield*/, ctx.db.insert("policies", {
                        projectId: projectId, // Associate with default project
                        version: 1,
                        name: "Default V0 Policy",
                        scopeType: "GLOBAL",
                        rules: {
                            reviewToDoneRequiresHuman: true,
                            reviewToDoneRequiresApproval: true,
                            budgetExceededRequiresApproval: true,
                            redToolsRequireApproval: true,
                            // CAO authority rules - Sofie as Chief Agent Officer
                            caoAgentName: "Sofie",
                            caoApprovalRequired: true,
                        },
                        toolRiskMap: {
                            // GREEN - safe
                            "read": "GREEN",
                            "web_search": "GREEN",
                            "web_fetch": "GREEN",
                            "memory_search": "GREEN",
                            // YELLOW - caution
                            "write": "YELLOW",
                            "edit": "YELLOW",
                            "exec": "YELLOW",
                            "bash": "YELLOW",
                            "shell": "YELLOW",
                            "browser": "YELLOW",
                            // RED - requires approval
                            "message": "RED",
                            "gateway": "RED",
                            "cron": "RED",
                            "deploy": "RED",
                        },
                        shellAllowlist: [
                            "ls", "cat", "grep", "find", "pwd", "echo",
                            "git status", "git diff", "git log", "git branch",
                            "npm", "pnpm", "yarn",
                            "node", "python", "python3",
                        ],
                        shellBlocklist: [
                            "rm -rf",
                            "sudo",
                            "chmod 777",
                            "curl | bash",
                            "wget | sh",
                            "../",
                            "~/.ssh",
                            "/etc/",
                        ],
                        fileReadPaths: [
                            "**/*.ts",
                            "**/*.tsx",
                            "**/*.js",
                            "**/*.jsx",
                            "**/*.json",
                            "**/*.md",
                            "**/*.txt",
                            "**/*.yaml",
                            "**/*.yml",
                        ],
                        fileWritePaths: [
                            "**/*.ts",
                            "**/*.tsx",
                            "**/*.js",
                            "**/*.jsx",
                            "**/*.json",
                            "**/*.md",
                            "**/*.txt",
                        ],
                        networkAllowlist: [
                            "api.convex.dev",
                            "github.com",
                            "api.github.com",
                            "npmjs.com",
                            "registry.npmjs.org",
                        ],
                        budgetDefaults: {
                            INTERN: { daily: 2.00, perRun: 0.25 },
                            SPECIALIST: { daily: 5.00, perRun: 0.75 },
                            LEAD: { daily: 12.00, perRun: 1.50 },
                        },
                        spawnLimits: {
                            maxGlobalActive: 30,
                            maxPerParent: 3,
                            maxDepth: 2,
                        },
                        loopThresholds: {
                            maxCommentsPerWindow: 20,
                            windowMinutes: 30,
                            maxReviewCycles: 3,
                            maxPingPong: 8,
                        },
                        active: true,
                        createdBy: "seed",
                        notes: "Default policy for V0 demo. Sofie is CAO. Includes allowlists for shell, filesystem, and network.",
                    })];
                case 23:
                    // =========================================================================
                    // DEFAULT POLICY
                    // =========================================================================
                    _c.sent();
                    return [2 /*return*/, {
                            message: "V0 seed complete!",
                            projects: 1,
                            agents: Object.keys(agentIds).length,
                            tasks: taskIds.length,
                            policies: 1,
                        }];
            }
        });
    }); },
});
/**
 * Backfill BJ's agent documents and metadata.
 * Safe to run multiple times — skips if documents already exist.
 * Run with: npx convex run seed:backfillBJDocs
 */
exports.backfillBJDocs = (0, server_1.mutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var bj, results, now, meta, existingWorking, existingDaily, today, existingSession;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("agents")
                        .filter(function (q) { return q.eq(q.field("name"), "BJ"); })
                        .first()];
                case 1:
                    bj = _a.sent();
                    if (!bj) {
                        return [2 /*return*/, { message: "BJ agent not found", skipped: true }];
                    }
                    results = [];
                    now = Date.now();
                    if (!!bj.soulVersionHash) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db.patch(bj._id, {
                            soulVersionHash: "sha256-bj7e8f9a0b1c",
                            emoji: "👨‍💼",
                        })];
                case 2:
                    _a.sent();
                    results.push("Added soulVersionHash and emoji");
                    _a.label = 3;
                case 3:
                    meta = bj.metadata || {};
                    if (!!meta.telegram) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.db.patch(bj._id, {
                            metadata: __assign(__assign({}, meta), { description: "Supervisor Orchestrator - Master supervisor with comprehensive knowledge of all 151+ agents. Primary point of contact for SellerFi work.", telegram: "@bj_sellerfi_bot", discord: "BJ#0001", whatsapp: "+1-555-BJ-AGENT", model: "Claude Opus 4", systemPrompt: "You are BJ, the Supervisor Orchestrator for SellerFi. You have comprehensive knowledge of all 151+ agents. You coordinate all SellerFi work \u2014 delegating to Tech Lead, Backend Architect, Frontend Developer, and other specialists. You do NOT implement directly." }),
                        })];
                case 4:
                    _a.sent();
                    results.push("Updated metadata with contacts and system prompt");
                    _a.label = 5;
                case 5: return [4 /*yield*/, ctx.db
                        .query("agentDocuments")
                        .withIndex("by_agent_type", function (q) {
                        return q.eq("agentId", bj._id).eq("type", "WORKING_MD");
                    })
                        .first()];
                case 6:
                    existingWorking = _a.sent();
                    if (!!existingWorking) return [3 /*break*/, 8];
                    return [4 /*yield*/, ctx.db.insert("agentDocuments", {
                            agentId: bj._id,
                            type: "WORKING_MD",
                            content: "# BJ \u2014 Working Document\n\n## Current Priorities\n1. Oversee SellerFi platform development across all agents\n2. Ensure Tech Lead and Backend Architect are aligned on architecture\n3. Monitor Frontend Developer progress on UI components\n4. Track Code Reviewer queue \u2014 no PRs should sit unreviewed > 24h\n5. Keep Context Manager synced on project state\n\n## Active Delegations\n| Task | Assigned To | Status | Notes |\n|------|-------------|--------|-------|\n| API Architecture Review | Tech Lead | IN_PROGRESS | Backend redesign |\n| Payment Integration | Backend Architect | PLANNING | Stripe integration |\n| Dashboard UI Refresh | Frontend Developer | IN_PROGRESS | React components |\n| Security Audit Sprint | Security Auditor | ASSIGNED | Pre-launch checklist |\n| CI/CD Pipeline | DevOps Engineer | IN_PROGRESS | GitHub Actions |\n\n## Team Health\n- **Agent Organizer**: ACTIVE, managing team structure\n- **Tech Lead**: ACTIVE, driving architecture decisions\n- **Context Manager**: ACTIVE, maintaining project context\n- **Backend Architect**: ACTIVE, API design work\n- **Frontend Developer**: ACTIVE, UI development\n- **Code Reviewer**: ACTIVE, reviewing PRs\n- **Test Writer**: ACTIVE, writing test suites\n- **Security Auditor**: ACTIVE, audit in progress\n- **DevOps Engineer**: ACTIVE, pipeline work\n- **Documentation Writer**: ACTIVE, updating docs\n\n## Notes\n- SellerFi launch target: track progress daily\n- Jay wants weekly status reports \u2014 compile every Friday\n- Consider adding a Data Engineer agent for analytics pipeline\n",
                            updatedAt: now,
                            metadata: { version: 1 },
                        })];
                case 7:
                    _a.sent();
                    results.push("Created WORKING_MD");
                    _a.label = 8;
                case 8: return [4 /*yield*/, ctx.db
                        .query("agentDocuments")
                        .withIndex("by_agent_type", function (q) {
                        return q.eq("agentId", bj._id).eq("type", "DAILY_NOTE");
                    })
                        .first()];
                case 9:
                    existingDaily = _a.sent();
                    if (!!existingDaily) return [3 /*break*/, 11];
                    today = new Date().toISOString().split("T")[0];
                    return [4 /*yield*/, ctx.db.insert("agentDocuments", {
                            agentId: bj._id,
                            type: "DAILY_NOTE",
                            content: "# Daily Note \u2014 ".concat(today, "\n\n## Morning Standup\n- All 10 SellerFi agents reporting ACTIVE status\n- No error streaks detected\n- Budget utilization: 22% of daily across all agents\n- 2 PRs awaiting code review\n- Security audit sprint at 40% completion\n\n## Actions Taken\n- Reviewed Tech Lead's architecture proposal for payment service\n- Delegated Stripe integration research to Backend Architect\n- Checked Frontend Developer's dashboard component progress\n- Reviewed Code Reviewer's latest feedback on API endpoints\n\n## Blockers\n- Waiting on Jay's approval for production deployment permissions\n\n## Escalations\n- None today\n\n## End of Day Summary\n- Pending: will update at EOD\n"),
                            updatedAt: now,
                            metadata: { date: today },
                        })];
                case 10:
                    _a.sent();
                    results.push("Created DAILY_NOTE");
                    _a.label = 11;
                case 11: return [4 /*yield*/, ctx.db
                        .query("agentDocuments")
                        .withIndex("by_agent_type", function (q) {
                        return q.eq("agentId", bj._id).eq("type", "SESSION_MEMORY");
                    })
                        .first()];
                case 12:
                    existingSession = _a.sent();
                    if (!!existingSession) return [3 /*break*/, 14];
                    return [4 /*yield*/, ctx.db.insert("agentDocuments", {
                            agentId: bj._id,
                            type: "SESSION_MEMORY",
                            content: "# Session Memory \u2014 BJ\n\n## Context\n- Project: SellerFi\n- Role: Supervisor Orchestrator\n- Reporting to: Jay (Human / Project Owner)\n- Team size: 10 agents (3 LEAD, 7 SPECIALIST)\n\n## Last Session Summary\n- Kicked off security audit sprint with Security Auditor\n- Aligned Tech Lead and Backend Architect on API v2 design\n- Reviewed Frontend Developer's component library progress\n- Updated Context Manager with sprint goals\n\n## Persistent State\n- Preferred delegation strategy: expertise-first, then availability\n- Current sprint focus: payment integration + security audit\n- Risk level: GREEN across all agents\n- SellerFi workspace: /Users/jaywest/SellerFi-GitHub\n\n## Key Decisions Log\n<!-- These are immutable historical seed records representing the initial session state -->\n- ".concat(new Date().toISOString().slice(0, 10), ": Chose Stripe over PayPal for payment integration\n- ").concat(new Date().toISOString().slice(0, 10), ": Approved Tech Lead's microservice architecture proposal\n- ").concat(new Date().toISOString().slice(0, 10), ": Prioritized security audit before launch\n"),
                            updatedAt: now,
                            metadata: { sessionId: "sellerfi-session-001" },
                        })];
                case 13:
                    _a.sent();
                    results.push("Created SESSION_MEMORY");
                    _a.label = 14;
                case 14: return [2 /*return*/, {
                        message: results.length > 0
                            ? "Backfilled BJ: ".concat(results.join(", "))
                            : "BJ already fully backfilled",
                        actions: results,
                    }];
            }
        });
    }); },
});
exports.clearAll = (0, server_1.mutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var tables, deleted, _i, tables_1, table, docs, _a, docs_1, doc;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    tables = [
                        "projects",
                        "agents",
                        "tasks",
                        "taskTransitions",
                        "messages",
                        "runs",
                        "toolCalls",
                        "approvals",
                        "activities",
                        "alerts",
                        "policies",
                        "notifications",
                        "threadSubscriptions",
                        "agentDocuments",
                    ];
                    deleted = 0;
                    _i = 0, tables_1 = tables;
                    _b.label = 1;
                case 1:
                    if (!(_i < tables_1.length)) return [3 /*break*/, 7];
                    table = tables_1[_i];
                    return [4 /*yield*/, ctx.db.query(table).collect()];
                case 2:
                    docs = _b.sent();
                    _a = 0, docs_1 = docs;
                    _b.label = 3;
                case 3:
                    if (!(_a < docs_1.length)) return [3 /*break*/, 6];
                    doc = docs_1[_a];
                    return [4 /*yield*/, ctx.db.delete(doc._id)];
                case 4:
                    _b.sent();
                    deleted++;
                    _b.label = 5;
                case 5:
                    _a++;
                    return [3 /*break*/, 3];
                case 6:
                    _i++;
                    return [3 /*break*/, 1];
                case 7: return [2 /*return*/, { message: "All data cleared", deleted: deleted }];
            }
        });
    }); },
});
/**
 * Backfill Sofie's agent documents and metadata.
 * Safe to run multiple times — skips if documents already exist.
 * Run with: npx convex run seed:backfillSofieDocs
 */
exports.backfillSofieDocs = (0, server_1.mutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var sofie, results, now, meta, existingWorking, existingDaily, today, existingSession;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("agents")
                        .filter(function (q) { return q.eq(q.field("name"), "Sofie"); })
                        .first()];
                case 1:
                    sofie = _a.sent();
                    if (!sofie) {
                        return [2 /*return*/, { message: "Sofie agent not found", skipped: true }];
                    }
                    results = [];
                    now = Date.now();
                    if (!!sofie.soulVersionHash) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db.patch(sofie._id, {
                            soulVersionHash: "sha256-a1b2c3d4e5f6",
                        })];
                case 2:
                    _a.sent();
                    results.push("Added soulVersionHash");
                    _a.label = 3;
                case 3:
                    meta = sofie.metadata || {};
                    if (!!meta.telegram) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.db.patch(sofie._id, {
                            metadata: __assign(__assign({}, meta), { isCAO: true, role: "Chief Agent Officer", telegram: "@sofie_cao_bot", discord: "Sofie#0001", model: "Claude Opus 4", systemPrompt: "You are Sofie, the Chief Agent Officer (CAO) for Mission Control. You oversee all agent operations, delegate strategic work, monitor agent health and budgets, resolve conflicts, and escalate to humans when needed. You do NOT execute domain work directly." }),
                        })];
                case 4:
                    _a.sent();
                    results.push("Updated metadata with contacts and system prompt");
                    _a.label = 5;
                case 5: return [4 /*yield*/, ctx.db
                        .query("agentDocuments")
                        .withIndex("by_agent_type", function (q) {
                        return q.eq("agentId", sofie._id).eq("type", "WORKING_MD");
                    })
                        .first()];
                case 6:
                    existingWorking = _a.sent();
                    if (!!existingWorking) return [3 /*break*/, 8];
                    return [4 /*yield*/, ctx.db.insert("agentDocuments", {
                            agentId: sofie._id,
                            type: "WORKING_MD",
                            content: "# Sofie \u2014 Working Document\n\n## Current Priorities\n1. Monitor all agent health and error streaks\n2. Ensure daily budgets are being respected\n3. Delegate incoming INBOX tasks to appropriate specialists\n4. Review tasks in REVIEW status for quality\n\n## Active Delegations\n| Task | Assigned To | Status | Notes |\n|------|-------------|--------|-------|\n| API Docs Update | Casey | IN_PROGRESS | On track |\n| Social Campaign | Jordan | REVIEW | Needs final check |\n| Competitor Research | Scout | INBOX | Unassigned, will delegate |\n\n## Agent Health Summary\n- **Perry** (COO): ACTIVE, healthy, 0 errors\n- **SellerFi**: ACTIVE, healthy, 0 errors\n- **Coach**: ACTIVE, healthy, 0 errors\n- **Casey**: ACTIVE, working on docs, 0 errors\n- **Alex**: ACTIVE, healthy, 0 errors\n- **Jordan**: ACTIVE, content work, 0 errors\n- **Scout**: ACTIVE, available for research, 0 errors\n- **Scribe**: ACTIVE, available, 0 errors\n- **Pixel**: ACTIVE, available, 0 errors\n- **Chip**: ACTIVE, available, 0 errors\n\n## Notes\n- Next strategic review scheduled for end of sprint\n- Consider spawning a sub-agent for the email marketing backlog\n",
                            updatedAt: now,
                            metadata: { version: 1 },
                        })];
                case 7:
                    _a.sent();
                    results.push("Created WORKING_MD");
                    _a.label = 8;
                case 8: return [4 /*yield*/, ctx.db
                        .query("agentDocuments")
                        .withIndex("by_agent_type", function (q) {
                        return q.eq("agentId", sofie._id).eq("type", "DAILY_NOTE");
                    })
                        .first()];
                case 9:
                    existingDaily = _a.sent();
                    if (!!existingDaily) return [3 /*break*/, 11];
                    today = new Date().toISOString().split("T")[0];
                    return [4 /*yield*/, ctx.db.insert("agentDocuments", {
                            agentId: sofie._id,
                            type: "DAILY_NOTE",
                            content: "# Daily Note \u2014 ".concat(today, "\n\n## Morning Review\n- All 10 agents reporting ACTIVE status\n- No error streaks detected\n- Budget utilization: 15% of daily across all agents\n- 3 tasks in INBOX awaiting delegation\n\n## Actions Taken\n- Reviewed Casey's API documentation progress \u2014 on track\n- Checked Jordan's social campaign submission \u2014 in REVIEW\n- Identified competitor research task for Scout delegation\n\n## Escalations\n- None today\n\n## End of Day Summary\n- Pending: will update at EOD\n"),
                            updatedAt: now,
                            metadata: { date: today },
                        })];
                case 10:
                    _a.sent();
                    results.push("Created DAILY_NOTE");
                    _a.label = 11;
                case 11: return [4 /*yield*/, ctx.db
                        .query("agentDocuments")
                        .withIndex("by_agent_type", function (q) {
                        return q.eq("agentId", sofie._id).eq("type", "SESSION_MEMORY");
                    })
                        .first()];
                case 12:
                    existingSession = _a.sent();
                    if (!!existingSession) return [3 /*break*/, 14];
                    return [4 /*yield*/, ctx.db.insert("agentDocuments", {
                            agentId: sofie._id,
                            type: "SESSION_MEMORY",
                            content: "# Session Memory \u2014 Sofie\n\n## Context\n- Project: OpenClaw\n- Role: CAO (Chief Agent Officer)\n- Reporting to: Human CHO (Chief Human Officer)\n\n## Last Session Summary\n- Delegated 2 tasks to specialists\n- Resolved a resource conflict between Casey and Scribe (both wanted the docs repo)\n- Approved Perry's operational plan for the week\n\n## Persistent State\n- Preferred delegation strategy: capability-first, then capacity\n- Current sprint focus: content pipeline + API documentation\n- Risk level: GREEN across all agents\n",
                            updatedAt: now,
                            metadata: { sessionId: "session-001" },
                        })];
                case 13:
                    _a.sent();
                    results.push("Created SESSION_MEMORY");
                    _a.label = 14;
                case 14: return [2 /*return*/, {
                        message: results.length > 0
                            ? "Backfilled Sofie: ".concat(results.join(", "))
                            : "Sofie already fully backfilled",
                        actions: results,
                    }];
            }
        });
    }); },
});
exports.getSeededStatus = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var projects, agents, tasks, policies;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.query("projects").take(1)];
                case 1:
                    projects = _b.sent();
                    return [4 /*yield*/, ctx.db.query("agents").take(1)];
                case 2:
                    agents = _b.sent();
                    return [4 /*yield*/, ctx.db.query("tasks").take(1)];
                case 3:
                    tasks = _b.sent();
                    return [4 /*yield*/, ctx.db.query("policies").take(1)];
                case 4:
                    policies = _b.sent();
                    _a = {
                        seeded: projects.length > 0 || agents.length > 0 || tasks.length > 0 || policies.length > 0
                    };
                    return [4 /*yield*/, ctx.db.query("projects").collect()];
                case 5:
                    _a.projectCount = (_b.sent()).length;
                    return [4 /*yield*/, ctx.db.query("agents").collect()];
                case 6:
                    _a.agentCount = (_b.sent()).length;
                    return [4 /*yield*/, ctx.db.query("tasks").collect()];
                case 7:
                    _a.taskCount = (_b.sent()).length;
                    return [4 /*yield*/, ctx.db.query("policies").collect()];
                case 8: return [2 /*return*/, (_a.policyCount = (_b.sent()).length,
                        _a)];
            }
        });
    }); },
});
/**
 * Activate specific agents for demo/testing — sets them ACTIVE with fresh
 * heartbeat and creates dedicated IN_PROGRESS tasks.
 * Run with: npx convex run seed:activateAgentsForDemo
 */
exports.activateAgentsForDemo = (0, server_1.mutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var now, results, demoConfigs, _loop_1, _i, demoConfigs_1, cfg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = Date.now();
                    results = [];
                    demoConfigs = [
                        {
                            name: "Sofie",
                            spend: 3.75,
                            taskTitle: "Review Q1 agent performance metrics and optimize squad allocation",
                            taskType: "OPS",
                        },
                        {
                            name: "BJ",
                            spend: 1.20,
                            taskTitle: "Coordinate SellerFi backend architecture review with specialists",
                            taskType: "ENGINEERING",
                        },
                    ];
                    _loop_1 = function (cfg) {
                        var agent, taskId;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, ctx.db
                                        .query("agents")
                                        .filter(function (q) { return q.eq(q.field("name"), cfg.name); })
                                        .first()];
                                case 1:
                                    agent = _b.sent();
                                    if (!agent) {
                                        results.push("".concat(cfg.name, ": not found"));
                                        return [2 /*return*/, "continue"];
                                    }
                                    return [4 /*yield*/, ctx.db.insert("tasks", {
                                            projectId: agent.projectId,
                                            title: cfg.taskTitle,
                                            description: "Seed demo task for ".concat(cfg.name, ": ").concat(cfg.taskTitle),
                                            type: cfg.taskType,
                                            status: "IN_PROGRESS",
                                            priority: 2,
                                            assigneeIds: [agent._id],
                                            reviewCycles: 0,
                                            actualCost: 0,
                                            startedAt: now - 15 * 60 * 1000,
                                            source: "SEED",
                                            workPlan: {
                                                bullets: ["Analyze current metrics", "Identify bottlenecks", "Propose optimizations"],
                                                estimatedCost: 2.50,
                                                estimatedDuration: "45 minutes",
                                            },
                                        })];
                                case 2:
                                    taskId = _b.sent();
                                    // Set ACTIVE with fresh heartbeat + currentTaskId
                                    return [4 /*yield*/, ctx.db.patch(agent._id, {
                                            status: "ACTIVE",
                                            lastHeartbeatAt: now,
                                            errorStreak: 0,
                                            lastError: undefined,
                                            spendToday: cfg.spend,
                                            currentTaskId: taskId,
                                        })];
                                case 3:
                                    // Set ACTIVE with fresh heartbeat + currentTaskId
                                    _b.sent();
                                    results.push("".concat(cfg.name, ": ACTIVE, working on \"").concat(cfg.taskTitle, "\""));
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, demoConfigs_1 = demoConfigs;
                    _a.label = 1;
                case 1:
                    if (!(_i < demoConfigs_1.length)) return [3 /*break*/, 4];
                    cfg = demoConfigs_1[_i];
                    return [5 /*yield**/, _loop_1(cfg)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, { results: results }];
            }
        });
    }); },
});
/**
 * Seed Council data — approvals (APPROVED, DENIED, PENDING) and coordinator activities.
 * Creates realistic multi-agent decision-making data for the Council view.
 * Run with: npx convex run seed:seedCouncilData
 */
exports.seedCouncilData = (0, server_1.mutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var now, HOUR, DAY, agents, project, projectId, tasks, agentByName, _i, agents_1, a, sofie, perry, alex, jordan, casey, sellerfi, approvalsCreated, activitiesCreated, approvalConfigs, _a, approvalConfigs_1, cfg, taskId, approvalId, coordinatorActivities, _b, coordinatorActivities_1, act, taskId, agent;
        var _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    now = Date.now();
                    HOUR = 60 * 60 * 1000;
                    DAY = 24 * HOUR;
                    return [4 /*yield*/, ctx.db.query("agents").collect()];
                case 1:
                    agents = _e.sent();
                    if (agents.length === 0) {
                        return [2 /*return*/, { message: "No agents found. Run seedV0 first.", skipped: true }];
                    }
                    return [4 /*yield*/, ctx.db.query("projects").first()];
                case 2:
                    project = _e.sent();
                    if (!project) {
                        return [2 /*return*/, { message: "No project found. Run seedV0 first.", skipped: true }];
                    }
                    projectId = project._id;
                    return [4 /*yield*/, ctx.db.query("tasks").take(8)];
                case 3:
                    tasks = _e.sent();
                    agentByName = {};
                    for (_i = 0, agents_1 = agents; _i < agents_1.length; _i++) {
                        a = agents_1[_i];
                        agentByName[a.name] = a;
                    }
                    sofie = agentByName["Sofie"];
                    perry = agentByName["Perry"];
                    alex = agentByName["Alex"];
                    jordan = agentByName["Jordan"];
                    casey = agentByName["Casey"];
                    sellerfi = agentByName["SellerFi"];
                    if (!sofie) {
                        return [2 /*return*/, { message: "Sofie agent not found. Run seedV0 first.", skipped: true }];
                    }
                    approvalsCreated = 0;
                    activitiesCreated = 0;
                    approvalConfigs = [
                        // APPROVED decisions
                        {
                            requestor: jordan,
                            actionType: "DEPLOY",
                            actionSummary: "Deploy social media content pipeline to production",
                            riskLevel: "RED",
                            justification: "Content pipeline has been tested in staging for 3 days with zero errors. All posts reviewed by Coach.",
                            status: "APPROVED",
                            decidedByUserId: "jay",
                            decisionReason: "Staging tests look solid. Approved for production deployment.",
                            timeAgo: 2 * HOUR,
                            estimatedCost: 0.50,
                            taskIndex: 3, // REVIEW task
                        },
                        {
                            requestor: alex,
                            actionType: "SHELL_EXEC",
                            actionSummary: "Execute database migration script for payment schema",
                            riskLevel: "RED",
                            justification: "Migration adds payment_intents table and indexes. Rollback script prepared. Tested on dev DB.",
                            status: "APPROVED",
                            decidedByUserId: "jay",
                            decisionReason: "Rollback plan is solid. Execute during low-traffic window.",
                            timeAgo: 6 * HOUR,
                            estimatedCost: 0.25,
                            taskIndex: 5, // BLOCKED task
                        },
                        {
                            requestor: casey,
                            actionType: "FILE_WRITE",
                            actionSummary: "Overwrite production API documentation with v2 spec",
                            riskLevel: "YELLOW",
                            justification: "v2 API docs are complete and reviewed. Old docs will be archived to /docs/archive/.",
                            status: "APPROVED",
                            decidedByAgentId: sofie === null || sofie === void 0 ? void 0 : sofie._id,
                            decisionReason: "Docs reviewed and archived. Proceed with publish.",
                            timeAgo: 1 * DAY,
                            taskIndex: 2, // IN_PROGRESS task
                        },
                        {
                            requestor: sellerfi,
                            actionType: "SHELL_EXEC",
                            actionSummary: "Run npm audit fix --force to patch 3 critical vulnerabilities",
                            riskLevel: "YELLOW",
                            justification: "npm audit found 3 critical CVEs in dependencies. --force needed for breaking semver updates.",
                            status: "APPROVED",
                            decidedByAgentId: sofie === null || sofie === void 0 ? void 0 : sofie._id,
                            decisionReason: "Critical CVEs must be patched. Run in isolated branch first.",
                            timeAgo: 1.5 * DAY,
                        },
                        // DENIED decisions
                        {
                            requestor: jordan,
                            actionType: "GATEWAY",
                            actionSummary: "Send bulk email campaign to 5,000 subscribers",
                            riskLevel: "RED",
                            justification: "Email campaign ready for Q1 product launch announcement. Copy approved by Perry.",
                            status: "DENIED",
                            decidedByUserId: "jay",
                            decisionReason: "Campaign copy needs legal review before mass send. Resubmit after legal signs off.",
                            timeAgo: 4 * HOUR,
                            estimatedCost: 12.50,
                            taskIndex: 4, // NEEDS_APPROVAL task
                        },
                        {
                            requestor: alex,
                            actionType: "DEPLOY",
                            actionSummary: "Deploy untested hotfix to production API server",
                            riskLevel: "RED",
                            justification: "Hotfix for API timeout issue reported by 3 users. Quick fix, skipping staging.",
                            status: "DENIED",
                            decidedByAgentId: sofie === null || sofie === void 0 ? void 0 : sofie._id,
                            decisionReason: "Cannot skip staging for production deploys. Run through CI/CD pipeline first.",
                            timeAgo: 8 * HOUR,
                            estimatedCost: 0.75,
                        },
                        // PENDING decisions (awaiting human input)
                        {
                            requestor: perry,
                            actionType: "CRON",
                            actionSummary: "Schedule automated weekly performance reports via cron job",
                            riskLevel: "RED",
                            justification: "Weekly reports compile agent metrics, budget usage, and task completion rates. Sends to Telegram and email.",
                            status: "PENDING",
                            timeAgo: 30 * 60 * 1000, // 30 minutes ago
                            estimatedCost: 1.00,
                        },
                        {
                            requestor: sellerfi,
                            actionType: "SHELL_EXEC",
                            actionSummary: "Execute production database backup before schema migration",
                            riskLevel: "YELLOW",
                            justification: "Pre-migration backup to S3. Standard procedure before any schema change.",
                            status: "PENDING",
                            timeAgo: 15 * 60 * 1000, // 15 minutes ago
                            estimatedCost: 0.30,
                        },
                    ];
                    _a = 0, approvalConfigs_1 = approvalConfigs;
                    _e.label = 4;
                case 4:
                    if (!(_a < approvalConfigs_1.length)) return [3 /*break*/, 8];
                    cfg = approvalConfigs_1[_a];
                    if (!cfg.requestor)
                        return [3 /*break*/, 7];
                    taskId = cfg.taskIndex !== undefined && tasks[cfg.taskIndex]
                        ? tasks[cfg.taskIndex]._id
                        : undefined;
                    return [4 /*yield*/, ctx.db.insert("approvals", {
                            projectId: projectId,
                            idempotencyKey: "council-seed:".concat(cfg.actionSummary.slice(0, 30)),
                            taskId: taskId,
                            requestorAgentId: cfg.requestor._id,
                            actionType: cfg.actionType,
                            actionSummary: cfg.actionSummary,
                            riskLevel: cfg.riskLevel,
                            estimatedCost: cfg.estimatedCost,
                            justification: cfg.justification,
                            status: cfg.status,
                            decidedByAgentId: cfg.decidedByAgentId,
                            decidedByUserId: cfg.decidedByUserId,
                            decidedAt: cfg.status !== "PENDING" ? now - cfg.timeAgo : undefined,
                            decisionReason: cfg.decisionReason,
                            expiresAt: now + 1 * HOUR,
                        })];
                case 5:
                    approvalId = _e.sent();
                    approvalsCreated++;
                    if (!(cfg.status !== "PENDING")) return [3 /*break*/, 7];
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: projectId,
                            actorType: cfg.decidedByUserId ? "HUMAN" : "AGENT",
                            actorId: (_c = cfg.decidedByUserId) !== null && _c !== void 0 ? _c : (_d = cfg.decidedByAgentId) === null || _d === void 0 ? void 0 : _d.toString(),
                            action: cfg.status === "APPROVED" ? "APPROVAL_APPROVED" : "APPROVAL_DENIED",
                            description: "".concat(cfg.status === "APPROVED" ? "Approved" : "Denied", ": ").concat(cfg.actionSummary),
                            targetType: "APPROVAL",
                            targetId: approvalId,
                            taskId: taskId,
                            agentId: cfg.requestor._id,
                        })];
                case 6:
                    _e.sent();
                    activitiesCreated++;
                    _e.label = 7;
                case 7:
                    _a++;
                    return [3 /*break*/, 4];
                case 8:
                    coordinatorActivities = [
                        {
                            action: "COORDINATOR_TASK_DECOMPOSED",
                            description: "Decomposed 'Launch Q1 Marketing Campaign' into 4 subtasks: content creation, social scheduling, email sequences, analytics setup",
                            timeAgo: 30 * 60 * 1000,
                            taskIndex: 0,
                        },
                        {
                            action: "COORDINATOR_DELEGATED",
                            description: "Delegated 'API Documentation v2' to Casey (best match: DOCS capability, 0% budget used, ACTIVE status)",
                            timeAgo: 1 * HOUR,
                            taskIndex: 2,
                            agentName: "Casey",
                        },
                        {
                            action: "COORDINATOR_DELEGATED",
                            description: "Delegated 'Social Media Campaign' to Jordan (best match: SOCIAL capability, low error streak, ACTIVE status)",
                            timeAgo: 2 * HOUR,
                            taskIndex: 3,
                            agentName: "Jordan",
                        },
                        {
                            action: "COORDINATOR_CONFLICT_RESOLVED",
                            description: "Resolved resource conflict: Casey and Scribe both requested access to docs repo. Assigned to Casey (higher priority task), deferred Scribe's work.",
                            timeAgo: 3 * HOUR,
                            agentName: "Casey",
                        },
                        {
                            action: "COORDINATOR_ESCALATED",
                            description: "Escalated to human: Alex's Stripe integration blocked for 48+ hours. Payment API keys required from finance team.",
                            timeAgo: 5 * HOUR,
                            taskIndex: 5,
                            agentName: "Alex",
                        },
                        {
                            action: "COORDINATOR_REBALANCED",
                            description: "Rebalanced squad: moved 2 INBOX tasks from overloaded Jordan (3 active) to available Coach (0 active)",
                            timeAgo: 6 * HOUR,
                        },
                        {
                            action: "COORDINATOR_LOOP_DETECTED",
                            description: "Detected review ping-pong loop on 'Social Media Campaign': 3 review cycles between Jordan and Coach. Injecting Sofie as mediator.",
                            timeAgo: 8 * HOUR,
                            taskIndex: 3,
                        },
                        {
                            action: "COORDINATOR_BUDGET_WARNING",
                            description: "Budget warning: Jordan at 85% daily budget ($4.25/$5.00). Throttling new task assignment until reset.",
                            timeAgo: 10 * HOUR,
                            agentName: "Jordan",
                        },
                        {
                            action: "COORDINATOR_AGENT_RECOVERED",
                            description: "Agent recovery: SellerFi heartbeat restored after 5-minute gap. Error streak reset from 2 to 0. Task resumed.",
                            timeAgo: 1 * DAY,
                            agentName: "SellerFi",
                        },
                        {
                            action: "COORDINATOR_STANDUP_COMPILED",
                            description: "Daily standup compiled: 7/7 agents ACTIVE, 3 tasks completed, 2 in review, 1 blocked. Overall health: GREEN.",
                            timeAgo: 1.2 * DAY,
                        },
                    ];
                    _b = 0, coordinatorActivities_1 = coordinatorActivities;
                    _e.label = 9;
                case 9:
                    if (!(_b < coordinatorActivities_1.length)) return [3 /*break*/, 12];
                    act = coordinatorActivities_1[_b];
                    taskId = act.taskIndex !== undefined && tasks[act.taskIndex]
                        ? tasks[act.taskIndex]._id
                        : undefined;
                    agent = act.agentName ? agentByName[act.agentName] : undefined;
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: projectId,
                            actorType: "SYSTEM",
                            action: act.action,
                            description: act.description,
                            targetType: taskId ? "TASK" : agent ? "AGENT" : undefined,
                            targetId: taskId !== null && taskId !== void 0 ? taskId : agent === null || agent === void 0 ? void 0 : agent._id,
                            taskId: taskId,
                            agentId: agent === null || agent === void 0 ? void 0 : agent._id,
                        })];
                case 10:
                    _e.sent();
                    activitiesCreated++;
                    _e.label = 11;
                case 11:
                    _b++;
                    return [3 /*break*/, 9];
                case 12: return [2 /*return*/, {
                        message: "Council data seeded!",
                        approvalsCreated: approvalsCreated,
                        activitiesCreated: activitiesCreated,
                    }];
            }
        });
    }); },
});

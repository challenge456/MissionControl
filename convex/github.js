"use strict";
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
exports.updateGitHubIssueStatus = exports.handleIssueWebhook = exports.syncGitHubIssues = exports.upsertTaskFromIssue = exports.linkTaskToGitHubPR = exports.linkTaskToGitHubIssue = exports.findTaskByIdempotencyKey = exports.listGitHubLinkedTasks = exports.getGitHubConfig = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var api_1 = require("./_generated/api");
/**
 * GitHub Integration
 *
 * Syncs GitHub issues as Mission Control tasks via the INBOX invariant:
 * - All tasks created from GitHub land in INBOX (never DONE/IN_PROGRESS).
 * - GitHub issue state is tracked separately in metadata.githubState.
 * - Idempotency is enforced via deterministic keys: `github:{owner}/{repo}#{number}`.
 * - Task types are mapped to valid schema values only.
 * - All task creation goes through api.tasks.create.
 */
// ============================================================================
// HELPERS
// ============================================================================
/** Build a deterministic idempotency key for a GitHub issue */
function githubIdempotencyKey(repoOwner, repoName, issueNumber) {
    return "github:".concat(repoOwner, "/").concat(repoName, "#").concat(issueNumber);
}
/** Map GitHub labels to a valid TaskType */
function mapLabelsToTaskType(labels) {
    var lower = labels.map(function (l) { return l.toLowerCase(); });
    if (lower.some(function (l) { return l.includes("bug") || l.includes("fix"); }))
        return "ENGINEERING";
    if (lower.some(function (l) { return l.includes("feature") || l.includes("enhancement"); }))
        return "ENGINEERING";
    if (lower.some(function (l) { return l.includes("docs") || l.includes("documentation"); }))
        return "DOCS";
    if (lower.some(function (l) { return l.includes("content") || l.includes("blog"); }))
        return "CONTENT";
    if (lower.some(function (l) { return l.includes("ops") || l.includes("infra") || l.includes("devops"); }))
        return "OPS";
    if (lower.some(function (l) { return l.includes("research"); }))
        return "CUSTOMER_RESEARCH";
    return "ENGINEERING"; // safe default
}
/** Map GitHub labels to task priority */
function mapLabelsToPriority(labels) {
    var lower = labels.map(function (l) { return l.toLowerCase(); });
    if (lower.some(function (l) { return l.includes("critical") || l.includes("p0"); }))
        return 1;
    if (lower.some(function (l) { return l.includes("high") || l.includes("p1"); }))
        return 2;
    if (lower.some(function (l) { return l.includes("low") || l.includes("p3"); }))
        return 4;
    return 3; // normal
}
// ============================================================================
// QUERIES
// ============================================================================
exports.getGitHubConfig = (0, server_1.query)({
    args: { projectId: values_1.v.id("projects") },
    handler: function (_ctx, _args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // TODO: Implement when githubSync table is added to schema
            return [2 /*return*/, null];
        });
    }); },
});
exports.listGitHubLinkedTasks = (0, server_1.query)({
    args: { projectId: values_1.v.id("projects") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var tasks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("tasks")
                        .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                        .collect()];
                case 1:
                    tasks = _a.sent();
                    return [2 /*return*/, tasks.filter(function (t) { return t.source === "GITHUB"; })];
            }
        });
    }); },
});
// ============================================================================
// INTERNAL QUERIES (used by actions)
// ============================================================================
/** Find an existing task by its GitHub idempotency key */
exports.findTaskByIdempotencyKey = (0, server_1.internalQuery)({
    args: { idempotencyKey: values_1.v.string() },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("tasks")
                        .withIndex("by_idempotency", function (q) { return q.eq("idempotencyKey", args.idempotencyKey); })
                        .first()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
exports.linkTaskToGitHubIssue = (0, server_1.mutation)({
    args: {
        taskId: values_1.v.id("tasks"),
        issueNumber: values_1.v.number(),
        repoUrl: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var task, existingMeta;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1:
                    task = _b.sent();
                    if (!task)
                        return [2 /*return*/, { success: false, error: "Task not found" }];
                    existingMeta = (_a = task.metadata) !== null && _a !== void 0 ? _a : {};
                    return [4 /*yield*/, ctx.db.patch(args.taskId, {
                            source: "GITHUB",
                            sourceRef: "".concat(args.repoUrl, "#").concat(args.issueNumber),
                            metadata: __assign(__assign({}, existingMeta), { githubIssueNumber: args.issueNumber, githubRepoUrl: args.repoUrl }),
                        })];
                case 2:
                    _b.sent();
                    // Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: task.projectId,
                            taskId: args.taskId,
                            actorType: "SYSTEM",
                            action: "GITHUB_LINKED",
                            description: "Linked to GitHub issue #".concat(args.issueNumber),
                            targetType: "TASK",
                            targetId: args.taskId,
                        })];
                case 3:
                    // Log activity
                    _b.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
exports.linkTaskToGitHubPR = (0, server_1.mutation)({
    args: {
        taskId: values_1.v.id("tasks"),
        prNumber: values_1.v.number(),
        branch: values_1.v.string(),
        repoUrl: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var task, existingMeta;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1:
                    task = _b.sent();
                    if (!task)
                        return [2 /*return*/, { success: false, error: "Task not found" }];
                    existingMeta = (_a = task.metadata) !== null && _a !== void 0 ? _a : {};
                    return [4 /*yield*/, ctx.db.patch(args.taskId, {
                            metadata: __assign(__assign({}, existingMeta), { githubPrNumber: args.prNumber, githubBranch: args.branch, githubRepoUrl: args.repoUrl }),
                        })];
                case 2:
                    _b.sent();
                    // Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: task.projectId,
                            taskId: args.taskId,
                            actorType: "SYSTEM",
                            action: "GITHUB_PR_LINKED",
                            description: "Linked to PR #".concat(args.prNumber, " (").concat(args.branch, ")"),
                            targetType: "TASK",
                            targetId: args.taskId,
                        })];
                case 3:
                    // Log activity
                    _b.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
/**
 * Upsert a task from a GitHub issue.
 * - Creates via api.tasks.create if new (lands in INBOX).
 * - Updates title/description/metadata if existing (does NOT change status).
 * - Tracks GitHub state separately in metadata.githubState.
 */
exports.upsertTaskFromIssue = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.id("projects"),
        repoOwner: values_1.v.string(),
        repoName: values_1.v.string(),
        issue: values_1.v.object({
            number: values_1.v.number(),
            title: values_1.v.string(),
            body: values_1.v.string(),
            state: values_1.v.string(), // "open" | "closed"
            labels: values_1.v.array(values_1.v.string()),
        }),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var idemKey, repoUrl, sourceRef, existing, existingMeta, result;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    idemKey = githubIdempotencyKey(args.repoOwner, args.repoName, args.issue.number);
                    repoUrl = "https://github.com/".concat(args.repoOwner, "/").concat(args.repoName);
                    sourceRef = "".concat(args.repoOwner, "/").concat(args.repoName, "#").concat(args.issue.number);
                    return [4 /*yield*/, ctx.db
                            .query("tasks")
                            .withIndex("by_idempotency", function (q) { return q.eq("idempotencyKey", idemKey); })
                            .first()];
                case 1:
                    existing = _c.sent();
                    if (!existing) return [3 /*break*/, 4];
                    existingMeta = (_a = existing.metadata) !== null && _a !== void 0 ? _a : {};
                    return [4 /*yield*/, ctx.db.patch(existing._id, {
                            title: "[GH-".concat(args.issue.number, "] ").concat(args.issue.title),
                            description: args.issue.body || existing.description,
                            labels: args.issue.labels.length > 0 ? args.issue.labels : existing.labels,
                            metadata: __assign(__assign({}, existingMeta), { githubState: args.issue.state, githubIssueNumber: args.issue.number, githubRepoUrl: repoUrl, githubLastSyncAt: Date.now() }),
                        })];
                case 2:
                    _c.sent();
                    // Log the sync
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: args.projectId,
                            taskId: existing._id,
                            actorType: "SYSTEM",
                            action: "GITHUB_SYNCED",
                            description: "Synced from GitHub issue #".concat(args.issue.number, " (").concat(args.issue.state, ")"),
                            targetType: "TASK",
                            targetId: existing._id,
                        })];
                case 3:
                    // Log the sync
                    _c.sent();
                    return [2 /*return*/, { taskId: existing._id, created: false }];
                case 4: return [4 /*yield*/, ctx.runMutation(api_1.api.tasks.create, {
                        projectId: args.projectId,
                        title: "[GH-".concat(args.issue.number, "] ").concat(args.issue.title),
                        description: args.issue.body,
                        type: mapLabelsToTaskType(args.issue.labels),
                        priority: mapLabelsToPriority(args.issue.labels),
                        labels: args.issue.labels,
                        idempotencyKey: idemKey,
                        source: "GITHUB",
                        sourceRef: sourceRef,
                        createdBy: "SYSTEM",
                        metadata: {
                            githubState: args.issue.state,
                            githubIssueNumber: args.issue.number,
                            githubRepoUrl: repoUrl,
                            githubLastSyncAt: Date.now(),
                        },
                    })];
                case 5:
                    result = _c.sent();
                    return [2 /*return*/, { taskId: (_b = result.task) === null || _b === void 0 ? void 0 : _b._id, created: true }];
            }
        });
    }); },
});
// ============================================================================
// ACTIONS (External API Calls)
// ============================================================================
/**
 * Sync all open issues from a GitHub repo.
 * Uses upsertTaskFromIssue for each issue — idempotent, safe to re-run.
 */
exports.syncGitHubIssues = (0, server_1.action)({
    args: {
        projectId: values_1.v.id("projects"),
        repoOwner: values_1.v.string(),
        repoName: values_1.v.string(),
        accessToken: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var response, issues, realIssues, created, updated, _i, realIssues_1, issue, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("https://api.github.com/repos/".concat(args.repoOwner, "/").concat(args.repoName, "/issues?state=all&per_page=100"), {
                        headers: {
                            Authorization: "Bearer ".concat(args.accessToken),
                            Accept: "application/vnd.github.v3+json",
                        },
                    })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("GitHub API error: ".concat(response.status, " ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    issues = _a.sent();
                    realIssues = issues.filter(function (i) { return !i.pull_request; });
                    created = 0;
                    updated = 0;
                    _i = 0, realIssues_1 = realIssues;
                    _a.label = 3;
                case 3:
                    if (!(_i < realIssues_1.length)) return [3 /*break*/, 6];
                    issue = realIssues_1[_i];
                    return [4 /*yield*/, ctx.runMutation(api_1.api.github.upsertTaskFromIssue, {
                            projectId: args.projectId,
                            repoOwner: args.repoOwner,
                            repoName: args.repoName,
                            issue: {
                                number: issue.number,
                                title: issue.title,
                                body: issue.body || "",
                                state: issue.state,
                                labels: issue.labels.map(function (l) { return l.name; }),
                            },
                        })];
                case 4:
                    result = _a.sent();
                    if (result.created)
                        created++;
                    else
                        updated++;
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [2 /*return*/, {
                        success: true,
                        issuesFound: realIssues.length,
                        tasksCreated: created,
                        tasksUpdated: updated,
                    }];
            }
        });
    }); },
});
/**
 * Handle a GitHub webhook event for issues.
 * Called by an HTTP endpoint (or Convex httpAction) when GitHub sends a webhook.
 * Supports: opened, edited, closed, reopened, labeled, unlabeled.
 */
exports.handleIssueWebhook = (0, server_1.action)({
    args: {
        projectId: values_1.v.id("projects"),
        repoOwner: values_1.v.string(),
        repoName: values_1.v.string(),
        action: values_1.v.string(), // "opened" | "edited" | "closed" | "reopened" | "labeled" | "unlabeled"
        issue: values_1.v.object({
            number: values_1.v.number(),
            title: values_1.v.string(),
            body: values_1.v.optional(values_1.v.string()),
            state: values_1.v.string(),
            labels: values_1.v.array(values_1.v.object({
                name: values_1.v.string(),
            })),
        }),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var labelNames, result;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    labelNames = args.issue.labels.map(function (l) { return l.name; });
                    return [4 /*yield*/, ctx.runMutation(api_1.api.github.upsertTaskFromIssue, {
                            projectId: args.projectId,
                            repoOwner: args.repoOwner,
                            repoName: args.repoName,
                            issue: {
                                number: args.issue.number,
                                title: args.issue.title,
                                body: (_a = args.issue.body) !== null && _a !== void 0 ? _a : "",
                                state: args.issue.state,
                                labels: labelNames,
                            },
                        })];
                case 1:
                    result = _b.sent();
                    return [2 /*return*/, {
                            success: true,
                            action: args.action,
                            taskId: result.taskId,
                            created: result.created,
                        }];
            }
        });
    }); },
});
exports.updateGitHubIssueStatus = (0, server_1.action)({
    args: {
        taskId: values_1.v.id("tasks"),
        repoOwner: values_1.v.string(),
        repoName: values_1.v.string(),
        issueNumber: values_1.v.number(),
        state: values_1.v.union(values_1.v.literal("open"), values_1.v.literal("closed")),
        accessToken: values_1.v.string(),
    },
    handler: function (_ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("https://api.github.com/repos/".concat(args.repoOwner, "/").concat(args.repoName, "/issues/").concat(args.issueNumber), {
                        method: "PATCH",
                        headers: {
                            Authorization: "Bearer ".concat(args.accessToken),
                            Accept: "application/vnd.github.v3+json",
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ state: args.state }),
                    })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("GitHub API error: ".concat(response.status, " ").concat(response.statusText));
                    }
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});

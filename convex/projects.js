"use strict";
/**
 * Projects — Convex Functions
 *
 * Multi-project workspaces for Mission Control.
 * Every entity (tasks, agents, approvals, etc.) is scoped to a project.
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
exports.updateSwarmConfig = exports.updateGitHubIntegration = exports.remove = exports.update = exports.create = exports.getStats = exports.getBySlug = exports.get = exports.list = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
// ============================================================================
// QUERIES
// ============================================================================
/**
 * List all projects.
 */
exports.list = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("projects").order("asc").collect()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/**
 * Get a project by ID.
 */
exports.get = (0, server_1.query)({
    args: { projectId: values_1.v.id("projects") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.projectId)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/**
 * Get a project by slug (unique identifier).
 */
exports.getBySlug = (0, server_1.query)({
    args: { slug: values_1.v.string() },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("projects")
                        .withIndex("by_slug", function (q) { return q.eq("slug", args.slug); })
                        .first()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/**
 * Get project stats (task counts, agent counts, pending approvals).
 */
exports.getStats = (0, server_1.query)({
    args: { projectId: values_1.v.id("projects") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var tasks, agents, _a, pendingApprovals, escalatedApprovals, byStatus;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("tasks")
                        .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                        .collect()];
                case 1:
                    tasks = _b.sent();
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 2:
                    agents = _b.sent();
                    return [4 /*yield*/, Promise.all([
                            ctx.db
                                .query("approvals")
                                .withIndex("by_project_status", function (q) {
                                return q.eq("projectId", args.projectId).eq("status", "PENDING");
                            })
                                .collect(),
                            ctx.db
                                .query("approvals")
                                .withIndex("by_project_status", function (q) {
                                return q.eq("projectId", args.projectId).eq("status", "ESCALATED");
                            })
                                .collect(),
                        ])];
                case 3:
                    _a = _b.sent(), pendingApprovals = _a[0], escalatedApprovals = _a[1];
                    byStatus = function (status) {
                        return tasks.filter(function (t) { return t.status === status; }).length;
                    };
                    return [2 /*return*/, {
                            projectId: args.projectId,
                            tasks: {
                                total: tasks.length,
                                inbox: byStatus("INBOX"),
                                assigned: byStatus("ASSIGNED"),
                                inProgress: byStatus("IN_PROGRESS"),
                                review: byStatus("REVIEW"),
                                needsApproval: byStatus("NEEDS_APPROVAL"),
                                blocked: byStatus("BLOCKED"),
                                done: byStatus("DONE"),
                                canceled: byStatus("CANCELED"),
                            },
                            agents: {
                                total: agents.length,
                                active: agents.filter(function (a) { return a.status === "ACTIVE"; }).length,
                                paused: agents.filter(function (a) { return a.status === "PAUSED"; }).length,
                            },
                            approvals: {
                                pending: pendingApprovals.length + escalatedApprovals.length,
                            },
                        }];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
/**
 * Create a new project.
 */
exports.create = (0, server_1.mutation)({
    args: {
        name: values_1.v.string(),
        slug: values_1.v.string(),
        description: values_1.v.optional(values_1.v.string()),
        tenantId: values_1.v.optional(values_1.v.id("tenants")), // ARM: Required for new projects
        policyDefaults: values_1.v.optional(values_1.v.object({
            budgetDefaults: values_1.v.optional(values_1.v.any()),
            riskThresholds: values_1.v.optional(values_1.v.any()),
        })),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var defaultTenant, tenantId, existing, projectId;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!!args.tenantId) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.db
                            .query("tenants")
                            .withIndex("by_slug", function (q) { return q.eq("slug", "default"); })
                            .first()];
                case 1:
                    defaultTenant = _b.sent();
                    if (!!defaultTenant) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.insert("tenants", {
                            name: "Default Organization",
                            slug: "default",
                            description: "Default tenant for migration",
                            active: true,
                        })];
                case 2:
                    tenantId = _b.sent();
                    return [4 /*yield*/, ctx.db.get(tenantId)];
                case 3:
                    defaultTenant = _b.sent();
                    _b.label = 4;
                case 4:
                    args.tenantId = defaultTenant._id;
                    _b.label = 5;
                case 5: return [4 /*yield*/, ctx.db
                        .query("projects")
                        .withIndex("by_slug", function (q) { return q.eq("slug", args.slug); })
                        .first()];
                case 6:
                    existing = _b.sent();
                    if (existing) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Project with slug \"".concat(args.slug, "\" already exists"),
                            }];
                    }
                    return [4 /*yield*/, ctx.db.insert("projects", {
                            tenantId: args.tenantId,
                            name: args.name,
                            slug: args.slug,
                            description: args.description,
                            policyDefaults: args.policyDefaults,
                            metadata: args.metadata,
                        })];
                case 7:
                    projectId = _b.sent();
                    // Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            actorType: "SYSTEM",
                            action: "PROJECT_CREATED",
                            description: "Project \"".concat(args.name, "\" created"),
                            targetType: "PROJECT",
                            targetId: projectId,
                            projectId: projectId,
                        })];
                case 8:
                    // Log activity
                    _b.sent();
                    _a = {
                        success: true
                    };
                    return [4 /*yield*/, ctx.db.get(projectId)];
                case 9: return [2 /*return*/, (_a.project = _b.sent(),
                        _a)];
            }
        });
    }); },
});
/**
 * Update a project.
 */
exports.update = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.id("projects"),
        name: values_1.v.optional(values_1.v.string()),
        description: values_1.v.optional(values_1.v.string()),
        policyDefaults: values_1.v.optional(values_1.v.object({
            budgetDefaults: values_1.v.optional(values_1.v.any()),
            riskThresholds: values_1.v.optional(values_1.v.any()),
        })),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var project, updates;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.projectId)];
                case 1:
                    project = _b.sent();
                    if (!project) {
                        return [2 /*return*/, { success: false, error: "Project not found" }];
                    }
                    updates = {};
                    if (args.name !== undefined)
                        updates.name = args.name;
                    if (args.description !== undefined)
                        updates.description = args.description;
                    if (args.policyDefaults !== undefined)
                        updates.policyDefaults = args.policyDefaults;
                    if (args.metadata !== undefined)
                        updates.metadata = args.metadata;
                    return [4 /*yield*/, ctx.db.patch(args.projectId, updates)];
                case 2:
                    _b.sent();
                    // Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            actorType: "SYSTEM",
                            action: "PROJECT_UPDATED",
                            description: "Project \"".concat(project.name, "\" updated"),
                            targetType: "PROJECT",
                            targetId: args.projectId,
                            projectId: args.projectId,
                            beforeState: project,
                            afterState: __assign(__assign({}, project), updates),
                        })];
                case 3:
                    // Log activity
                    _b.sent();
                    _a = {
                        success: true
                    };
                    return [4 /*yield*/, ctx.db.get(args.projectId)];
                case 4: return [2 /*return*/, (_a.project = _b.sent(),
                        _a)];
            }
        });
    }); },
});
/**
 * Delete a project (only if empty).
 */
exports.remove = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.id("projects"),
        force: values_1.v.optional(values_1.v.boolean()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var project, tasks, agents;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.projectId)];
                case 1:
                    project = _a.sent();
                    if (!project) {
                        return [2 /*return*/, { success: false, error: "Project not found" }];
                    }
                    return [4 /*yield*/, ctx.db
                            .query("tasks")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .take(1)];
                case 2:
                    tasks = _a.sent();
                    if (tasks.length > 0 && !args.force) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Project has tasks. Use force=true to delete anyway (not recommended).",
                            }];
                    }
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .take(1)];
                case 3:
                    agents = _a.sent();
                    if (agents.length > 0 && !args.force) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Project has agents. Use force=true to delete anyway (not recommended).",
                            }];
                    }
                    return [4 /*yield*/, ctx.db.delete(args.projectId)];
                case 4:
                    _a.sent();
                    // Log activity (to a null project since we're deleting it)
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            actorType: "SYSTEM",
                            action: "PROJECT_DELETED",
                            description: "Project \"".concat(project.name, "\" deleted"),
                            targetType: "PROJECT",
                            targetId: args.projectId,
                            metadata: { deletedProject: project },
                        })];
                case 5:
                    // Log activity (to a null project since we're deleting it)
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
/**
 * Update GitHub integration settings for a project.
 */
exports.updateGitHubIntegration = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.id("projects"),
        githubRepo: values_1.v.optional(values_1.v.string()),
        githubBranch: values_1.v.optional(values_1.v.string()),
        githubWebhookSecret: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var project, identity, updates, sanitizedUpdates;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.projectId)];
                case 1:
                    project = _b.sent();
                    if (!project) {
                        return [2 /*return*/, { success: false, error: "Project not found" }];
                    }
                    return [4 /*yield*/, ctx.auth.getUserIdentity()];
                case 2:
                    identity = _b.sent();
                    if (!identity) {
                        return [2 /*return*/, { success: false, error: "Unauthorized: No identity found" }];
                    }
                    updates = {};
                    if (args.githubRepo !== undefined)
                        updates.githubRepo = args.githubRepo;
                    if (args.githubBranch !== undefined)
                        updates.githubBranch = args.githubBranch;
                    if (args.githubWebhookSecret !== undefined)
                        updates.githubWebhookSecret = args.githubWebhookSecret;
                    return [4 /*yield*/, ctx.db.patch(args.projectId, updates)];
                case 3:
                    _b.sent();
                    sanitizedUpdates = __assign({}, updates);
                    if (sanitizedUpdates.githubWebhookSecret !== undefined) {
                        sanitizedUpdates.githubWebhookSecret = "[REDACTED]";
                    }
                    // Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            actorType: "HUMAN",
                            actorId: identity.subject,
                            action: "PROJECT_GITHUB_UPDATED",
                            description: "GitHub integration updated for \"".concat(project.name, "\""),
                            targetType: "PROJECT",
                            targetId: args.projectId,
                            projectId: args.projectId,
                            metadata: { updates: sanitizedUpdates },
                        })];
                case 4:
                    // Log activity
                    _b.sent();
                    _a = { success: true };
                    return [4 /*yield*/, ctx.db.get(args.projectId)];
                case 5: return [2 /*return*/, (_a.project = _b.sent(), _a)];
            }
        });
    }); },
});
/**
 * Update agent swarm configuration for a project.
 */
exports.updateSwarmConfig = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.id("projects"),
        maxAgents: values_1.v.optional(values_1.v.number()),
        defaultModel: values_1.v.optional(values_1.v.string()),
        autoScale: values_1.v.optional(values_1.v.boolean()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var project, identity, swarmConfig;
        var _a;
        var _b, _c, _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.projectId)];
                case 1:
                    project = _k.sent();
                    if (!project) {
                        return [2 /*return*/, { success: false, error: "Project not found" }];
                    }
                    return [4 /*yield*/, ctx.auth.getUserIdentity()];
                case 2:
                    identity = _k.sent();
                    if (!identity) {
                        return [2 /*return*/, { success: false, error: "Unauthorized: No identity found" }];
                    }
                    swarmConfig = {
                        maxAgents: (_d = (_b = args.maxAgents) !== null && _b !== void 0 ? _b : (_c = project.swarmConfig) === null || _c === void 0 ? void 0 : _c.maxAgents) !== null && _d !== void 0 ? _d : 5,
                        defaultModel: (_e = args.defaultModel) !== null && _e !== void 0 ? _e : (_f = project.swarmConfig) === null || _f === void 0 ? void 0 : _f.defaultModel,
                        autoScale: (_j = (_g = args.autoScale) !== null && _g !== void 0 ? _g : (_h = project.swarmConfig) === null || _h === void 0 ? void 0 : _h.autoScale) !== null && _j !== void 0 ? _j : false,
                    };
                    return [4 /*yield*/, ctx.db.patch(args.projectId, { swarmConfig: swarmConfig })];
                case 3:
                    _k.sent();
                    // Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            actorType: "HUMAN",
                            actorId: identity.subject,
                            action: "PROJECT_SWARM_CONFIG_UPDATED",
                            description: "Swarm config updated for \"".concat(project.name, "\""),
                            targetType: "PROJECT",
                            targetId: args.projectId,
                            projectId: args.projectId,
                            metadata: { swarmConfig: swarmConfig },
                        })];
                case 4:
                    // Log activity
                    _k.sent();
                    _a = { success: true };
                    return [4 /*yield*/, ctx.db.get(args.projectId)];
                case 5: return [2 /*return*/, (_a.project = _k.sent(), _a)];
            }
        });
    }); },
});

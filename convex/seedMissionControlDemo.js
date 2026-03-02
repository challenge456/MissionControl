"use strict";
/**
 * Mission Control demo seeder.
 *
 * Seeds dense, cross-linked data for UI validation across:
 * Alerts, Approvals, Operations, ARM (Directory/Policies/Deployments/Audit/Telemetry),
 * Agents (Registry/Identities/Memory), Projects (Projects/Captures/Docs),
 * Comms (Chat/Council/Telegraph/Meetings/Voice), and Admin (People/Org/Office).
 *
 * Run with:
 *   npx convex run seedMissionControlDemo:run
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
var server_1 = require("./_generated/server");
var genomeHash_1 = require("./lib/genomeHash");
var values_1 = require("convex/values");
var SEED_VERSION = "mc-demo-v1";
var SEED_TAG = "mc-demo";
var HOUR = 60 * 60 * 1000;
var DAY = 24 * HOUR;
function withSeedMeta(seedKey, extra) {
    return __assign(__assign({}, (extra !== null && extra !== void 0 ? extra : {})), { seedTag: SEED_TAG, seedVersion: SEED_VERSION, seedKey: seedKey });
}
function pick(arr, i) {
    return arr[i % arr.length];
}
function slugify(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function ensureTenant(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var tenant, tenantId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("tenants")
                        .withIndex("by_slug", function (q) { return q.eq("slug", "mission-control"); })
                        .first()];
                case 1:
                    tenant = _a.sent();
                    if (!!tenant) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.insert("tenants", {
                            name: "Mission Control",
                            slug: "mission-control",
                            description: "Primary tenant for Mission Control demo data",
                            active: true,
                            metadata: withSeedMeta("tenant:mission-control"),
                        })];
                case 2:
                    tenantId = _a.sent();
                    return [4 /*yield*/, ctx.db.get(tenantId)];
                case 3:
                    tenant = _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, tenant];
            }
        });
    });
}
function ensureProject(ctx, tenantId) {
    return __awaiter(this, void 0, void 0, function () {
        var project, projectId;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("projects")
                        .withIndex("by_slug", function (q) { return q.eq("slug", "mission-control"); })
                        .first()];
                case 1:
                    project = _b.sent();
                    if (!!project) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.insert("projects", {
                            tenantId: tenantId,
                            name: "Mission Control",
                            slug: "mission-control",
                            description: "Operational command center for ARM + Mission Control validation",
                            metadata: withSeedMeta("project:mission-control", {
                                repo: "MissionControl",
                            }),
                        })];
                case 2:
                    projectId = _b.sent();
                    return [4 /*yield*/, ctx.db.get(projectId)];
                case 3:
                    project = _b.sent();
                    return [3 /*break*/, 7];
                case 4:
                    if (!(!project.tenantId || project.tenantId !== tenantId)) return [3 /*break*/, 7];
                    return [4 /*yield*/, ctx.db.patch(project._id, {
                            tenantId: tenantId,
                            metadata: __assign(__assign({}, ((_a = project.metadata) !== null && _a !== void 0 ? _a : {})), { tenantLinkedAt: Date.now() }),
                        })];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, ctx.db.get(project._id)];
                case 6:
                    project = _b.sent();
                    _b.label = 7;
                case 7: return [2 /*return*/, project];
            }
        });
    });
}
function ensureEnvironment(ctx, tenantId, name, type) {
    return __awaiter(this, void 0, void 0, function () {
        var sameType, existing, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("environments")
                        .withIndex("by_tenant_type", function (q) { return q.eq("tenantId", tenantId).eq("type", type); })
                        .collect()];
                case 1:
                    sameType = _a.sent();
                    existing = sameType.find(function (row) { return row.name.toLowerCase() === name.toLowerCase(); });
                    if (existing)
                        return [2 /*return*/, existing];
                    return [4 /*yield*/, ctx.db.insert("environments", {
                            tenantId: tenantId,
                            name: name,
                            type: type,
                            description: "".concat(name, " environment"),
                            metadata: withSeedMeta("env:".concat(type)),
                        })];
                case 2:
                    id = _a.sent();
                    return [4 /*yield*/, ctx.db.get(id)];
                case 3: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function ensureOperator(ctx, tenantId, name, email) {
    return __awaiter(this, void 0, void 0, function () {
        var op, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("operators")
                        .withIndex("by_tenant_email", function (q) { return q.eq("tenantId", tenantId).eq("email", email); })
                        .first()];
                case 1:
                    op = _a.sent();
                    if (!!op) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.insert("operators", {
                            tenantId: tenantId,
                            email: email,
                            name: name,
                            active: true,
                            createdAt: Date.now(),
                            lastLoginAt: Date.now() - 2 * HOUR,
                            metadata: withSeedMeta("operator:".concat(email)),
                        })];
                case 2:
                    id = _a.sent();
                    return [4 /*yield*/, ctx.db.get(id)];
                case 3:
                    op = _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, op];
            }
        });
    });
}
function ensurePermission(ctx, resource, action, description) {
    return __awaiter(this, void 0, void 0, function () {
        var perm, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("permissions")
                        .withIndex("by_resource_action", function (q) { return q.eq("resource", resource).eq("action", action); })
                        .first()];
                case 1:
                    perm = _a.sent();
                    if (!!perm) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.insert("permissions", {
                            resource: resource,
                            action: action,
                            description: description,
                            metadata: withSeedMeta("permission:".concat(resource, ":").concat(action)),
                        })];
                case 2:
                    id = _a.sent();
                    return [4 /*yield*/, ctx.db.get(id)];
                case 3:
                    perm = _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, perm];
            }
        });
    });
}
function ensureRole(ctx, tenantId, name, description, permissions) {
    return __awaiter(this, void 0, void 0, function () {
        var role, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("roles")
                        .withIndex("by_tenant_name", function (q) { return q.eq("tenantId", tenantId).eq("name", name); })
                        .first()];
                case 1:
                    role = _a.sent();
                    if (!!role) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.insert("roles", {
                            tenantId: tenantId,
                            name: name,
                            description: description,
                            permissions: permissions,
                            metadata: withSeedMeta("role:".concat(name)),
                        })];
                case 2:
                    id = _a.sent();
                    return [4 /*yield*/, ctx.db.get(id)];
                case 3:
                    role = _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, role];
            }
        });
    });
}
function ensureRoleAssignment(ctx, operatorId, roleId, scope) {
    return __awaiter(this, void 0, void 0, function () {
        var existing, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("roleAssignments")
                        .withIndex("by_operator_role", function (q) { return q.eq("operatorId", operatorId).eq("roleId", roleId); })
                        .first()];
                case 1:
                    existing = _a.sent();
                    if (existing)
                        return [2 /*return*/, existing];
                    return [4 /*yield*/, ctx.db.insert("roleAssignments", {
                            operatorId: operatorId,
                            roleId: roleId,
                            scope: scope,
                            assignedAt: Date.now(),
                            metadata: withSeedMeta("assignment:".concat(operatorId, ":").concat(roleId)),
                        })];
                case 2:
                    id = _a.sent();
                    return [4 /*yield*/, ctx.db.get(id)];
                case 3: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function ensureOrgMember(ctx, args) {
    return __awaiter(this, void 0, void 0, function () {
        var existing, _a, id;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!args.email) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db.query("orgMembers").withIndex("by_email", function (q) { return q.eq("email", args.email); }).first()];
                case 1:
                    _a = _c.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = null;
                    _c.label = 3;
                case 3:
                    existing = _a;
                    if (!existing) return [3 /*break*/, 6];
                    return [4 /*yield*/, ctx.db.patch(existing._id, {
                            tenantId: args.tenantId,
                            projectId: args.projectId,
                            name: args.name,
                            role: args.role,
                            title: args.title,
                            avatar: args.avatar,
                            parentMemberId: args.parentMemberId,
                            level: args.level,
                            systemRole: args.systemRole,
                            active: true,
                        })];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, ctx.db.get(existing._id)];
                case 5: return [2 /*return*/, _c.sent()];
                case 6: return [4 /*yield*/, ctx.db.insert("orgMembers", {
                        tenantId: args.tenantId,
                        projectId: args.projectId,
                        name: args.name,
                        email: args.email,
                        role: args.role,
                        title: args.title,
                        avatar: args.avatar,
                        parentMemberId: args.parentMemberId,
                        level: args.level,
                        active: true,
                        responsibilities: ["".concat(args.role, " oversight"), "Operational execution", "Risk management"],
                        systemRole: args.systemRole,
                        projectAccess: [
                            {
                                projectId: args.projectId,
                                accessLevel: args.systemRole === "VIEWER" ? "VIEW" : args.systemRole === "MEMBER" ? "EDIT" : "ADMIN",
                            },
                        ],
                        permissions: ["tasks.create", "tasks.edit", "agents.view", "approvals.view"],
                        invitedAt: Date.now() - DAY,
                        metadata: withSeedMeta("member:".concat((_b = args.email) !== null && _b !== void 0 ? _b : slugify(args.name))),
                    })];
                case 7:
                    id = _c.sent();
                    return [4 /*yield*/, ctx.db.get(id)];
                case 8: return [2 /*return*/, _c.sent()];
            }
        });
    });
}
function ensureAgent(ctx, args) {
    return __awaiter(this, void 0, void 0, function () {
        var agent, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("agents").withIndex("by_name", function (q) { return q.eq("name", args.name); }).first()];
                case 1:
                    agent = _a.sent();
                    if (!agent) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.patch(agent._id, {
                            tenantId: args.tenantId,
                            projectId: args.projectId,
                            emoji: args.emoji,
                            role: args.role,
                            status: args.status,
                            allowedTaskTypes: args.allowedTaskTypes,
                            budgetDaily: args.budgetDaily,
                            budgetPerRun: args.budgetPerRun,
                            spendToday: args.spendToday,
                            canSpawn: args.canSpawn,
                            maxSubAgents: args.maxSubAgents,
                            parentAgentId: args.parentAgentId,
                            workspacePath: "/mission-control/agents/".concat(slugify(args.name)),
                            errorStreak: 0,
                            lastHeartbeatAt: Date.now() - Math.floor(Math.random() * 20 * 60 * 1000),
                            metadata: withSeedMeta("agent:".concat(slugify(args.name)), {
                                model: args.role === "LEAD" || args.role === "CEO" ? "gpt-5" : "gpt-4.1",
                            }),
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, ctx.db.get(agent._id)];
                case 3: return [2 /*return*/, _a.sent()];
                case 4: return [4 /*yield*/, ctx.db.insert("agents", {
                        tenantId: args.tenantId,
                        projectId: args.projectId,
                        name: args.name,
                        emoji: args.emoji,
                        role: args.role,
                        status: args.status,
                        workspacePath: "/mission-control/agents/".concat(slugify(args.name)),
                        soulVersionHash: "seed-".concat(slugify(args.name), "-soul-v1"),
                        allowedTaskTypes: args.allowedTaskTypes,
                        allowedTools: ["read", "write", "shell", "web_search", "web_fetch", "planner"],
                        budgetDaily: args.budgetDaily,
                        budgetPerRun: args.budgetPerRun,
                        spendToday: args.spendToday,
                        spendResetAt: Date.now() + DAY,
                        canSpawn: args.canSpawn,
                        maxSubAgents: args.maxSubAgents,
                        parentAgentId: args.parentAgentId,
                        errorStreak: 0,
                        lastHeartbeatAt: Date.now() - Math.floor(Math.random() * 20 * 60 * 1000),
                        metadata: withSeedMeta("agent:".concat(slugify(args.name)), {
                            model: args.role === "LEAD" || args.role === "CEO" ? "gpt-5" : "gpt-4.1-mini",
                            persona: "".concat(args.name, " ").concat(args.role),
                        }),
                    })];
                case 5:
                    id = _a.sent();
                    return [4 /*yield*/, ctx.db.get(id)];
                case 6: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function collectCounts(ctx, projectId, tenantId) {
    return __awaiter(this, void 0, void 0, function () {
        var tasks, agents, approvals, messages, captures, opEvents, templates, deployments;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("tasks").withIndex("by_project", function (q) { return q.eq("projectId", projectId); }).collect()];
                case 1:
                    tasks = _a.sent();
                    return [4 /*yield*/, ctx.db.query("agents").withIndex("by_project", function (q) { return q.eq("projectId", projectId); }).collect()];
                case 2:
                    agents = _a.sent();
                    return [4 /*yield*/, ctx.db.query("approvals").withIndex("by_project", function (q) { return q.eq("projectId", projectId); }).collect()];
                case 3:
                    approvals = _a.sent();
                    return [4 /*yield*/, ctx.db.query("messages").withIndex("by_project", function (q) { return q.eq("projectId", projectId); }).collect()];
                case 4:
                    messages = _a.sent();
                    return [4 /*yield*/, ctx.db.query("captures").withIndex("by_project", function (q) { return q.eq("projectId", projectId); }).collect()];
                case 5:
                    captures = _a.sent();
                    return [4 /*yield*/, ctx.db.query("opEvents").withIndex("by_project", function (q) { return q.eq("projectId", projectId); }).collect()];
                case 6:
                    opEvents = _a.sent();
                    return [4 /*yield*/, ctx.db.query("agentTemplates").withIndex("by_project", function (q) { return q.eq("projectId", projectId); }).collect()];
                case 7:
                    templates = _a.sent();
                    return [4 /*yield*/, ctx.db.query("deployments").withIndex("by_tenant", function (q) { return q.eq("tenantId", tenantId); }).collect()];
                case 8:
                    deployments = _a.sent();
                    return [2 /*return*/, {
                            agents: agents.length,
                            tasks: tasks.length,
                            approvals: approvals.length,
                            messages: messages.length,
                            captures: captures.length,
                            opEvents: opEvents.length,
                            armTemplates: templates.length,
                            armDeployments: deployments.length,
                        }];
            }
        });
    });
}
exports.run = (0, server_1.mutation)({
    args: {
        force: values_1.v.optional(values_1.v.boolean()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var now, tenant, project, projectMeta, envDev, envStaging, envProd, permissionSpecs, _i, permissionSpecs_1, _a, resource, action, description, roles, operators, ceo, coo, cto, agentDefs, agentByName, _b, agentDefs_1, def, parentId, agent, allAgents, _loop_1, _c, agentDefs_2, def, templateDefs, templateBySlug, versionByTemplateAndVersion, approvedVersionByTemplate, _loop_2, _d, templateDefs_1, _e, name_1, slug, description, provider, modelId, instanceByAgentId, _loop_3, i, _loop_4, i, existingProjectPolicies, policyDefs, _loop_5, _f, policyDefs_1, def, deploymentsByTenant, deploymentDefs, _loop_6, i, taskTypes, taskStatuses, activeAgents, taskIdByKey, _loop_7, _g, _h, epic, epicKeys, insertedTaskIds, _loop_8, i, transitionActorPool, _loop_9, i, dependencyRows, _loop_10, i, messageTypes, messageIds, _loop_11, i, runIds, _loop_12, i, toolCallIds, tools, i, runId, run_1, toolName, riskLevel, status_1, startedAt, endedAt, id, approvalIds, approvalRecordIds, i, agent, instance, status_2, riskLevel, taskId, toolCallId, approvalId, approvalRecordId, coordinatorActions, i, agent, taskId, i, taskId, runId, agent, status_3, i, recipient, i, taskId, agent, _loop_13, i, threadIds, i, threadId, telegraphMessageIds, i, threadId, sender, msgId, _loop_14, _j, threadIds_1, threadId, meetingIds, i, status_4, meetingId, i, changeRecordIds, _k, _l, _m, slug, template, changeId, _o, _p, _q, key, versionDoc, changeId, _r, _s, _t, agentId, instance, changeId, deploymentRows, _u, deploymentRows_1, dep, createdId, activeId, rollbackId, opEventTypes, i, runId, run_2, toolCallId, taskId, eventType, existingControl, preReleaseRuleset, postMergeRuleset, qcRunIds, qcRunStatuses, qcRiskGrades, qcQualityScores, i, runSequence, runId, status_5, riskGrade, qualityScore, startedAt, completedAt, durationMs, findingCounts, qcRunId, severities, categories, findingIdx, _v, severities_1, severity, count, j, seedMeta;
        var _w, _x, _y, _z;
        var _0, _1, _2, _3, _4, _5, _6, _7;
        return __generator(this, function (_8) {
            switch (_8.label) {
                case 0:
                    now = Date.now();
                    return [4 /*yield*/, ensureTenant(ctx)];
                case 1:
                    tenant = _8.sent();
                    return [4 /*yield*/, ensureProject(ctx, tenant._id)];
                case 2:
                    project = _8.sent();
                    projectMeta = ((_0 = project.metadata) !== null && _0 !== void 0 ? _0 : {});
                    if (!(!args.force && projectMeta.missionControlDemoSeedVersion === SEED_VERSION)) return [3 /*break*/, 4];
                    _w = {
                        message: "Mission Control demo data already seeded",
                        skipped: true,
                        tenantId: tenant._id,
                        projectId: project._id
                    };
                    return [4 /*yield*/, collectCounts(ctx, project._id, tenant._id)];
                case 3: return [2 /*return*/, (_w.counts = _8.sent(),
                        _w)];
                case 4: return [4 /*yield*/, ensureEnvironment(ctx, tenant._id, "Development", "dev")];
                case 5:
                    envDev = _8.sent();
                    return [4 /*yield*/, ensureEnvironment(ctx, tenant._id, "Staging", "staging")];
                case 6:
                    envStaging = _8.sent();
                    return [4 /*yield*/, ensureEnvironment(ctx, tenant._id, "Production", "prod")];
                case 7:
                    envProd = _8.sent();
                    permissionSpecs = [
                        ["tasks", "create", "Create tasks"],
                        ["tasks", "read", "Read tasks"],
                        ["tasks", "update", "Update tasks"],
                        ["tasks", "transition", "Transition task status"],
                        ["agents", "read", "Read agents"],
                        ["agents", "manage", "Manage agents"],
                        ["approvals", "read", "Read approvals"],
                        ["approvals", "decide", "Approve or deny approvals"],
                        ["policy", "read", "Read policy envelopes"],
                        ["policy", "manage", "Manage policy envelopes"],
                        ["deployments", "create", "Create deployments"],
                        ["deployments", "activate", "Activate deployments"],
                        ["deployments", "rollback", "Rollback deployments"],
                        ["telemetry", "read", "Read telemetry"],
                        ["telegraph", "read", "Read telegraph threads"],
                        ["telegraph", "write", "Write telegraph messages"],
                        ["meetings", "read", "Read meetings"],
                        ["meetings", "manage", "Manage meetings"],
                        ["people", "read", "Read people directory"],
                        ["people", "manage", "Manage people directory"],
                    ];
                    _i = 0, permissionSpecs_1 = permissionSpecs;
                    _8.label = 8;
                case 8:
                    if (!(_i < permissionSpecs_1.length)) return [3 /*break*/, 11];
                    _a = permissionSpecs_1[_i], resource = _a[0], action = _a[1], description = _a[2];
                    return [4 /*yield*/, ensurePermission(ctx, resource, action, description)];
                case 9:
                    _8.sent();
                    _8.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 8];
                case 11:
                    _x = {};
                    return [4 /*yield*/, ensureRole(ctx, tenant._id, "Owner", "Full control", [
                            "tasks.create",
                            "tasks.read",
                            "tasks.update",
                            "tasks.transition",
                            "agents.read",
                            "agents.manage",
                            "approvals.read",
                            "approvals.decide",
                            "policy.read",
                            "policy.manage",
                            "deployments.create",
                            "deployments.activate",
                            "deployments.rollback",
                            "telemetry.read",
                            "people.manage",
                        ])];
                case 12:
                    _x.owner = _8.sent();
                    return [4 /*yield*/, ensureRole(ctx, tenant._id, "Operator", "Daily operations", [
                            "tasks.read",
                            "tasks.update",
                            "tasks.transition",
                            "agents.read",
                            "approvals.read",
                            "approvals.decide",
                            "telemetry.read",
                            "telegraph.read",
                            "telegraph.write",
                        ])];
                case 13:
                    _x.operator = _8.sent();
                    return [4 /*yield*/, ensureRole(ctx, tenant._id, "Reviewer", "Review + compliance", [
                            "tasks.read",
                            "approvals.read",
                            "approvals.decide",
                            "policy.read",
                            "telemetry.read",
                        ])];
                case 14:
                    _x.reviewer = _8.sent();
                    return [4 /*yield*/, ensureRole(ctx, tenant._id, "Observer", "Read-only access", [
                            "tasks.read",
                            "agents.read",
                            "approvals.read",
                            "telemetry.read",
                        ])];
                case 15:
                    roles = (_x.observer = _8.sent(),
                        _x);
                    _y = {};
                    return [4 /*yield*/, ensureOperator(ctx, tenant._id, "Jay West", "jay@missioncontrol.local")];
                case 16:
                    _y.jay = _8.sent();
                    return [4 /*yield*/, ensureOperator(ctx, tenant._id, "Maya Cole", "maya@missioncontrol.local")];
                case 17:
                    _y.maya = _8.sent();
                    return [4 /*yield*/, ensureOperator(ctx, tenant._id, "Rene Park", "rene@missioncontrol.local")];
                case 18:
                    _y.rene = _8.sent();
                    return [4 /*yield*/, ensureOperator(ctx, tenant._id, "Iris Shaw", "iris@missioncontrol.local")];
                case 19:
                    _y.iris = _8.sent();
                    return [4 /*yield*/, ensureOperator(ctx, tenant._id, "Leo Finch", "leo@missioncontrol.local")];
                case 20:
                    operators = (_y.leo = _8.sent(),
                        _y);
                    return [4 /*yield*/, ensureRoleAssignment(ctx, operators.jay._id, roles.owner._id, {
                            type: "tenant",
                            id: tenant._id,
                        })];
                case 21:
                    _8.sent();
                    return [4 /*yield*/, ensureRoleAssignment(ctx, operators.maya._id, roles.operator._id, {
                            type: "project",
                            id: project._id,
                        })];
                case 22:
                    _8.sent();
                    return [4 /*yield*/, ensureRoleAssignment(ctx, operators.rene._id, roles.reviewer._id, {
                            type: "project",
                            id: project._id,
                        })];
                case 23:
                    _8.sent();
                    return [4 /*yield*/, ensureRoleAssignment(ctx, operators.iris._id, roles.operator._id, {
                            type: "environment",
                            id: envStaging._id,
                        })];
                case 24:
                    _8.sent();
                    return [4 /*yield*/, ensureRoleAssignment(ctx, operators.leo._id, roles.observer._id, {
                            type: "project",
                            id: project._id,
                        })];
                case 25:
                    _8.sent();
                    return [4 /*yield*/, ensureOrgMember(ctx, {
                            tenantId: tenant._id,
                            projectId: project._id,
                            name: "Jay West",
                            email: "jay@missioncontrol.local",
                            role: "Founder",
                            title: "CEO",
                            avatar: "👤",
                            level: 0,
                            systemRole: "OWNER",
                        })];
                case 26:
                    ceo = _8.sent();
                    return [4 /*yield*/, ensureOrgMember(ctx, {
                            tenantId: tenant._id,
                            projectId: project._id,
                            name: "Maya Cole",
                            email: "maya@missioncontrol.local",
                            role: "Operations",
                            title: "COO",
                            avatar: "📈",
                            parentMemberId: ceo._id,
                            level: 1,
                            systemRole: "ADMIN",
                        })];
                case 27:
                    coo = _8.sent();
                    return [4 /*yield*/, ensureOrgMember(ctx, {
                            tenantId: tenant._id,
                            projectId: project._id,
                            name: "Rene Park",
                            email: "rene@missioncontrol.local",
                            role: "Engineering",
                            title: "CTO",
                            avatar: "🛠️",
                            parentMemberId: ceo._id,
                            level: 1,
                            systemRole: "ADMIN",
                        })];
                case 28:
                    cto = _8.sent();
                    return [4 /*yield*/, ensureOrgMember(ctx, {
                            tenantId: tenant._id,
                            projectId: project._id,
                            name: "Iris Shaw",
                            email: "iris@missioncontrol.local",
                            role: "Risk",
                            title: "Governance Lead",
                            avatar: "🧭",
                            parentMemberId: coo._id,
                            level: 2,
                            systemRole: "MANAGER",
                        })];
                case 29:
                    _8.sent();
                    return [4 /*yield*/, ensureOrgMember(ctx, {
                            tenantId: tenant._id,
                            projectId: project._id,
                            name: "Leo Finch",
                            email: "leo@missioncontrol.local",
                            role: "Support",
                            title: "Support Lead",
                            avatar: "🤝",
                            parentMemberId: coo._id,
                            level: 2,
                            systemRole: "MEMBER",
                        })];
                case 30:
                    _8.sent();
                    return [4 /*yield*/, ensureOrgMember(ctx, {
                            tenantId: tenant._id,
                            projectId: project._id,
                            name: "Nora Bell",
                            email: "nora@missioncontrol.local",
                            role: "Compliance",
                            title: "Audit Specialist",
                            avatar: "📚",
                            parentMemberId: cto._id,
                            level: 2,
                            systemRole: "MEMBER",
                        })];
                case 31:
                    _8.sent();
                    agentDefs = [
                        {
                            name: "MC Atlas",
                            emoji: "🧭",
                            role: "CEO",
                            status: "ACTIVE",
                            allowedTaskTypes: ["OPS", "ENGINEERING", "DOCS", "CUSTOMER_RESEARCH"],
                            budgetDaily: 30,
                            budgetPerRun: 3,
                            spendToday: 8.2,
                            canSpawn: true,
                            maxSubAgents: 8,
                        },
                        {
                            name: "MC Orbit",
                            emoji: "🛰️",
                            role: "LEAD",
                            status: "ACTIVE",
                            allowedTaskTypes: ["OPS", "ENGINEERING", "DOCS"],
                            budgetDaily: 16,
                            budgetPerRun: 2,
                            spendToday: 5.4,
                            canSpawn: true,
                            maxSubAgents: 4,
                            parentName: "MC Atlas",
                        },
                        {
                            name: "MC Sentinel",
                            emoji: "🛡️",
                            role: "LEAD",
                            status: "ACTIVE",
                            allowedTaskTypes: ["OPS", "ENGINEERING", "DOCS"],
                            budgetDaily: 16,
                            budgetPerRun: 2,
                            spendToday: 7.9,
                            canSpawn: true,
                            maxSubAgents: 4,
                            parentName: "MC Atlas",
                        },
                        {
                            name: "MC Beacon",
                            emoji: "📣",
                            role: "SPECIALIST",
                            status: "ACTIVE",
                            allowedTaskTypes: ["CONTENT", "SOCIAL", "EMAIL_MARKETING"],
                            budgetDaily: 7,
                            budgetPerRun: 0.9,
                            spendToday: 2.4,
                            canSpawn: false,
                            maxSubAgents: 0,
                            parentName: "MC Orbit",
                        },
                        {
                            name: "MC Forge",
                            emoji: "⚙️",
                            role: "SPECIALIST",
                            status: "ACTIVE",
                            allowedTaskTypes: ["ENGINEERING", "OPS"],
                            budgetDaily: 8,
                            budgetPerRun: 1.1,
                            spendToday: 3.6,
                            canSpawn: false,
                            maxSubAgents: 0,
                            parentName: "MC Orbit",
                        },
                        {
                            name: "MC Quill",
                            emoji: "✍️",
                            role: "SPECIALIST",
                            status: "PAUSED",
                            allowedTaskTypes: ["DOCS", "CONTENT"],
                            budgetDaily: 7,
                            budgetPerRun: 0.8,
                            spendToday: 1.2,
                            canSpawn: false,
                            maxSubAgents: 0,
                            parentName: "MC Orbit",
                        },
                        {
                            name: "MC Pulse",
                            emoji: "📡",
                            role: "SPECIALIST",
                            status: "ACTIVE",
                            allowedTaskTypes: ["CUSTOMER_RESEARCH", "SEO_RESEARCH", "OPS"],
                            budgetDaily: 7,
                            budgetPerRun: 0.9,
                            spendToday: 2.1,
                            canSpawn: false,
                            maxSubAgents: 0,
                            parentName: "MC Sentinel",
                        },
                        {
                            name: "MC Relay",
                            emoji: "📬",
                            role: "SPECIALIST",
                            status: "ACTIVE",
                            allowedTaskTypes: ["EMAIL_MARKETING", "CONTENT", "SOCIAL"],
                            budgetDaily: 7,
                            budgetPerRun: 0.9,
                            spendToday: 3.0,
                            canSpawn: false,
                            maxSubAgents: 0,
                            parentName: "MC Sentinel",
                        },
                        {
                            name: "MC Drift",
                            emoji: "🧪",
                            role: "INTERN",
                            status: "ACTIVE",
                            allowedTaskTypes: ["CUSTOMER_RESEARCH", "DOCS", "SOCIAL"],
                            budgetDaily: 2.5,
                            budgetPerRun: 0.3,
                            spendToday: 0.6,
                            canSpawn: false,
                            maxSubAgents: 0,
                            parentName: "MC Pulse",
                        },
                        {
                            name: "MC Patch",
                            emoji: "🧰",
                            role: "INTERN",
                            status: "ACTIVE",
                            allowedTaskTypes: ["ENGINEERING", "DOCS"],
                            budgetDaily: 2.5,
                            budgetPerRun: 0.3,
                            spendToday: 0.8,
                            canSpawn: false,
                            maxSubAgents: 0,
                            parentName: "MC Forge",
                        },
                        {
                            name: "MC Echo",
                            emoji: "🔊",
                            role: "INTERN",
                            status: "OFFLINE",
                            allowedTaskTypes: ["CONTENT", "SOCIAL"],
                            budgetDaily: 2.5,
                            budgetPerRun: 0.3,
                            spendToday: 0.1,
                            canSpawn: false,
                            maxSubAgents: 0,
                            parentName: "MC Beacon",
                        },
                        {
                            name: "MC Vault",
                            emoji: "🔐",
                            role: "SPECIALIST",
                            status: "QUARANTINED",
                            allowedTaskTypes: ["ENGINEERING", "OPS"],
                            budgetDaily: 8,
                            budgetPerRun: 1.0,
                            spendToday: 4.8,
                            canSpawn: false,
                            maxSubAgents: 0,
                            parentName: "MC Sentinel",
                        },
                    ];
                    agentByName = new Map();
                    _b = 0, agentDefs_1 = agentDefs;
                    _8.label = 32;
                case 32:
                    if (!(_b < agentDefs_1.length)) return [3 /*break*/, 35];
                    def = agentDefs_1[_b];
                    parentId = def.parentName ? (_1 = agentByName.get(def.parentName)) === null || _1 === void 0 ? void 0 : _1._id : undefined;
                    return [4 /*yield*/, ensureAgent(ctx, {
                            tenantId: tenant._id,
                            projectId: project._id,
                            name: def.name,
                            emoji: def.emoji,
                            role: def.role,
                            status: def.status,
                            allowedTaskTypes: def.allowedTaskTypes,
                            budgetDaily: def.budgetDaily,
                            budgetPerRun: def.budgetPerRun,
                            spendToday: def.spendToday,
                            canSpawn: def.canSpawn,
                            maxSubAgents: def.maxSubAgents,
                            parentAgentId: parentId,
                        })];
                case 33:
                    agent = _8.sent();
                    agentByName.set(def.name, {
                        _id: agent._id,
                        name: agent.name,
                        role: agent.role,
                        status: agent.status,
                    });
                    _8.label = 34;
                case 34:
                    _b++;
                    return [3 /*break*/, 32];
                case 35:
                    allAgents = __spreadArray([], agentByName.values(), true);
                    _loop_1 = function (def) {
                        var agent, position, existingAssignments, duplicate;
                        return __generator(this, function (_9) {
                            switch (_9.label) {
                                case 0:
                                    agent = agentByName.get(def.name);
                                    position = def.role === "CEO" ? "CEO" : def.role === "LEAD" ? "LEAD" : def.role === "SPECIALIST" ? "SPECIALIST" : "INTERN";
                                    return [4 /*yield*/, ctx.db
                                            .query("orgAssignments")
                                            .withIndex("by_agent", function (q) { return q.eq("agentId", agent._id); })
                                            .collect()];
                                case 1:
                                    existingAssignments = _9.sent();
                                    duplicate = existingAssignments.find(function (row) { return row.projectId === project._id && row.orgPosition === position; });
                                    if (!!duplicate) return [3 /*break*/, 3];
                                    return [4 /*yield*/, ctx.db.insert("orgAssignments", {
                                            agentId: agent._id,
                                            projectId: project._id,
                                            orgPosition: position,
                                            scope: "PROJECT",
                                            scopeRef: "mission-control",
                                            assignedBy: "seed",
                                            assignedAt: now,
                                            metadata: withSeedMeta("org-assignment:".concat(def.name)),
                                        })];
                                case 2:
                                    _9.sent();
                                    _9.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    };
                    _c = 0, agentDefs_2 = agentDefs;
                    _8.label = 36;
                case 36:
                    if (!(_c < agentDefs_2.length)) return [3 /*break*/, 39];
                    def = agentDefs_2[_c];
                    return [5 /*yield**/, _loop_1(def)];
                case 37:
                    _8.sent();
                    _8.label = 38;
                case 38:
                    _c++;
                    return [3 /*break*/, 36];
                case 39:
                    templateDefs = [
                        ["Orchestrator Core", "mc-orchestrator", "Routing and delegation kernel", "openai", "gpt-5"],
                        ["Execution Engine", "mc-execution", "Tool execution and runtime lifecycle", "openai", "gpt-4.1"],
                        ["Research Analyst", "mc-research", "Research and synthesis profile", "openai", "gpt-4.1-mini"],
                        ["Comms Operator", "mc-comms", "Communication and council operations", "openai", "gpt-4.1"],
                        ["Policy Guard", "mc-policy", "Policy evaluation and risk controls", "openai", "gpt-5-mini"],
                        ["Release Manager", "mc-release", "Deployments and release governance", "openai", "gpt-4.1"],
                    ];
                    templateBySlug = new Map();
                    versionByTemplateAndVersion = new Map();
                    approvedVersionByTemplate = new Map();
                    _loop_2 = function (name_1, slug, description, provider, modelId) {
                        var template, id, existingVersions, statusByVersion, _loop_15, _10, _11, version;
                        return __generator(this, function (_12) {
                            switch (_12.label) {
                                case 0: return [4 /*yield*/, ctx.db
                                        .query("agentTemplates")
                                        .withIndex("by_tenant_slug", function (q) { return q.eq("tenantId", tenant._id).eq("slug", slug); })
                                        .first()];
                                case 1:
                                    template = _12.sent();
                                    if (!!template) return [3 /*break*/, 4];
                                    return [4 /*yield*/, ctx.db.insert("agentTemplates", {
                                            tenantId: tenant._id,
                                            projectId: project._id,
                                            name: name_1,
                                            slug: slug,
                                            description: description,
                                            active: true,
                                            createdAt: now - 21 * DAY,
                                            updatedAt: now - 1 * HOUR,
                                            metadata: withSeedMeta("template:".concat(slug)),
                                        })];
                                case 2:
                                    id = _12.sent();
                                    return [4 /*yield*/, ctx.db.get(id)];
                                case 3:
                                    template = _12.sent();
                                    _12.label = 4;
                                case 4:
                                    if (!template)
                                        throw new Error("Failed to create template ".concat(slug));
                                    templateBySlug.set(slug, template);
                                    return [4 /*yield*/, ctx.db
                                            .query("agentVersions")
                                            .withIndex("by_template", function (q) { return q.eq("templateId", template._id); })
                                            .collect()];
                                case 5:
                                    existingVersions = _12.sent();
                                    statusByVersion = {
                                        1: "DEPRECATED",
                                        2: "APPROVED",
                                        3: "CANDIDATE",
                                    };
                                    _loop_15 = function (version) {
                                        var versionDoc, genome, id;
                                        return __generator(this, function (_13) {
                                            switch (_13.label) {
                                                case 0:
                                                    versionDoc = existingVersions.find(function (row) { return row.version === version; });
                                                    genome = {
                                                        modelConfig: {
                                                            provider: provider,
                                                            modelId: modelId,
                                                            temperature: version === 3 ? 0.5 : 0.2,
                                                            maxTokens: 8192,
                                                        },
                                                        promptBundleHash: "prompt:".concat(slug, ":v").concat(version),
                                                        toolManifestHash: "tools:".concat(slug, ":v").concat(version),
                                                        provenance: {
                                                            createdBy: "seedMissionControlDemo",
                                                            source: "seed",
                                                            createdAt: now - (20 - version) * DAY,
                                                        },
                                                    };
                                                    if (!!versionDoc) return [3 /*break*/, 3];
                                                    return [4 /*yield*/, ctx.db.insert("agentVersions", {
                                                            tenantId: tenant._id,
                                                            projectId: project._id,
                                                            templateId: template._id,
                                                            version: version,
                                                            genomeHash: (0, genomeHash_1.computeGenomeHash)(genome),
                                                            genome: genome,
                                                            status: statusByVersion[version],
                                                            notes: "Seeded ".concat(statusByVersion[version], " version"),
                                                            createdAt: now - (20 - version) * DAY,
                                                            updatedAt: now - (5 - version) * DAY,
                                                            metadata: withSeedMeta("version:".concat(slug, ":v").concat(version)),
                                                        })];
                                                case 1:
                                                    id = _13.sent();
                                                    return [4 /*yield*/, ctx.db.get(id)];
                                                case 2:
                                                    versionDoc = _13.sent();
                                                    _13.label = 3;
                                                case 3:
                                                    if (!versionDoc)
                                                        throw new Error("Failed to create version ".concat(slug, ":v").concat(version));
                                                    versionByTemplateAndVersion.set("".concat(slug, ":").concat(version), versionDoc);
                                                    if (versionDoc.status === "APPROVED") {
                                                        approvedVersionByTemplate.set(slug, versionDoc);
                                                    }
                                                    return [2 /*return*/];
                                            }
                                        });
                                    };
                                    _10 = 0, _11 = [1, 2, 3];
                                    _12.label = 6;
                                case 6:
                                    if (!(_10 < _11.length)) return [3 /*break*/, 9];
                                    version = _11[_10];
                                    return [5 /*yield**/, _loop_15(version)];
                                case 7:
                                    _12.sent();
                                    _12.label = 8;
                                case 8:
                                    _10++;
                                    return [3 /*break*/, 6];
                                case 9: return [2 /*return*/];
                            }
                        });
                    };
                    _d = 0, templateDefs_1 = templateDefs;
                    _8.label = 40;
                case 40:
                    if (!(_d < templateDefs_1.length)) return [3 /*break*/, 43];
                    _e = templateDefs_1[_d], name_1 = _e[0], slug = _e[1], description = _e[2], provider = _e[3], modelId = _e[4];
                    return [5 /*yield**/, _loop_2(name_1, slug, description, provider, modelId)];
                case 41:
                    _8.sent();
                    _8.label = 42;
                case 42:
                    _d++;
                    return [3 /*break*/, 40];
                case 43:
                    instanceByAgentId = new Map();
                    _loop_3 = function (i) {
                        var agent, templateSlug, template, approvedVersion, envId, instanceStatus, instance, id;
                        return __generator(this, function (_14) {
                            switch (_14.label) {
                                case 0:
                                    agent = allAgents[i];
                                    templateSlug = agent.role === "CEO"
                                        ? "mc-orchestrator"
                                        : agent.role === "LEAD"
                                            ? i % 2 === 0
                                                ? "mc-release"
                                                : "mc-policy"
                                            : agent.role === "SPECIALIST"
                                                ? i % 2 === 0
                                                    ? "mc-execution"
                                                    : "mc-comms"
                                                : "mc-research";
                                    template = templateBySlug.get(templateSlug);
                                    approvedVersion = approvedVersionByTemplate.get(templateSlug);
                                    if (!template || !approvedVersion) {
                                        throw new Error("Missing template/version for ".concat(templateSlug));
                                    }
                                    envId = agent.role === "INTERN" ? envDev._id : agent.role === "SPECIALIST" ? envStaging._id : envProd._id;
                                    instanceStatus = agent.status === "ACTIVE"
                                        ? "ACTIVE"
                                        : agent.status === "PAUSED"
                                            ? "PAUSED"
                                            : agent.status === "QUARANTINED"
                                                ? "QUARANTINED"
                                                : agent.status === "DRAINED"
                                                    ? "DRAINING"
                                                    : "READONLY";
                                    return [4 /*yield*/, ctx.db
                                            .query("agentInstances")
                                            .withIndex("by_legacy_agent", function (q) { return q.eq("legacyAgentId", agent._id); })
                                            .first()];
                                case 1:
                                    instance = _14.sent();
                                    if (!!instance) return [3 /*break*/, 4];
                                    return [4 /*yield*/, ctx.db.insert("agentInstances", {
                                            tenantId: tenant._id,
                                            projectId: project._id,
                                            templateId: template._id,
                                            versionId: approvedVersion._id,
                                            environmentId: envId,
                                            name: "".concat(agent.name, " Instance"),
                                            status: instanceStatus,
                                            legacyAgentId: agent._id,
                                            activatedAt: now - (i + 1) * HOUR,
                                            metadata: withSeedMeta("instance:".concat(agent.name)),
                                        })];
                                case 2:
                                    id = _14.sent();
                                    return [4 /*yield*/, ctx.db.get(id)];
                                case 3:
                                    instance = _14.sent();
                                    return [3 /*break*/, 7];
                                case 4: return [4 /*yield*/, ctx.db.patch(instance._id, {
                                        tenantId: tenant._id,
                                        projectId: project._id,
                                        templateId: template._id,
                                        versionId: approvedVersion._id,
                                        environmentId: envId,
                                        status: instanceStatus,
                                        metadata: withSeedMeta("instance:".concat(agent.name)),
                                    })];
                                case 5:
                                    _14.sent();
                                    return [4 /*yield*/, ctx.db.get(instance._id)];
                                case 6:
                                    instance = _14.sent();
                                    _14.label = 7;
                                case 7:
                                    instanceByAgentId.set(agent._id, instance);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _8.label = 44;
                case 44:
                    if (!(i < allAgents.length)) return [3 /*break*/, 47];
                    return [5 /*yield**/, _loop_3(i)];
                case 45:
                    _8.sent();
                    _8.label = 46;
                case 46:
                    i++;
                    return [3 /*break*/, 44];
                case 47:
                    _loop_4 = function (i) {
                        var agent, instance, validationStatus, existing, payload;
                        return __generator(this, function (_15) {
                            switch (_15.label) {
                                case 0:
                                    agent = allAgents[i];
                                    instance = instanceByAgentId.get(agent._id);
                                    validationStatus = i % 7 === 0 ? "PARTIAL" : i % 11 === 0 ? "INVALID" : i % 5 === 0 ? "MISSING" : "VALID";
                                    return [4 /*yield*/, ctx.db
                                            .query("agentIdentities")
                                            .withIndex("by_agent", function (q) { return q.eq("agentId", agent._id); })
                                            .first()];
                                case 1:
                                    existing = _15.sent();
                                    payload = {
                                        tenantId: tenant._id,
                                        agentId: agent._id,
                                        templateId: instance === null || instance === void 0 ? void 0 : instance.templateId,
                                        versionId: instance === null || instance === void 0 ? void 0 : instance.versionId,
                                        instanceId: instance === null || instance === void 0 ? void 0 : instance._id,
                                        legacyAgentId: agent._id,
                                        name: agent.name,
                                        creature: i % 2 === 0 ? "Falcon" : "Wolf",
                                        vibe: i % 3 === 0 ? "Strategic and calm" : "Direct and execution-focused",
                                        emoji: (_2 = agent.emoji) !== null && _2 !== void 0 ? _2 : "🤖",
                                        avatarPath: "assets/avatars/".concat(slugify(agent.name), ".png"),
                                        soulContent: "# ".concat(agent.name, " Soul\n\n## Core Truths\n- Safety first\n- Deliver complete outcomes\n\n## Boundaries\n- Escalate RED actions\n- Keep audit trails complete"),
                                        soulHash: "soul-".concat(slugify(agent.name), "-v1"),
                                        toolsNotes: "read, write, shell, web_search, telegraph",
                                        validationStatus: validationStatus,
                                        validationErrors: validationStatus === "VALID"
                                            ? undefined
                                            : validationStatus === "MISSING"
                                                ? ["SOUL.md missing", "IDENTITY.md incomplete"]
                                                : validationStatus === "PARTIAL"
                                                    ? ["vibe field incomplete"]
                                                    : ["invalid avatar path", "empty core truths"],
                                        lastScannedAt: now - i * HOUR,
                                        metadata: withSeedMeta("identity:".concat(agent.name)),
                                    };
                                    if (!!existing) return [3 /*break*/, 3];
                                    return [4 /*yield*/, ctx.db.insert("agentIdentities", payload)];
                                case 2:
                                    _15.sent();
                                    return [3 /*break*/, 5];
                                case 3: return [4 /*yield*/, ctx.db.patch(existing._id, payload)];
                                case 4:
                                    _15.sent();
                                    _15.label = 5;
                                case 5: return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _8.label = 48;
                case 48:
                    if (!(i < allAgents.length)) return [3 /*break*/, 51];
                    return [5 /*yield**/, _loop_4(i)];
                case 49:
                    _8.sent();
                    _8.label = 50;
                case 50:
                    i++;
                    return [3 /*break*/, 48];
                case 51: return [4 /*yield*/, ctx.db
                        .query("policyEnvelopes")
                        .withIndex("by_project", function (q) { return q.eq("projectId", project._id); })
                        .collect()];
                case 52:
                    existingProjectPolicies = _8.sent();
                    policyDefs = [
                        {
                            key: "policy:project-default",
                            name: "Project Default Guardrail",
                            priority: 50,
                            templateId: undefined,
                            versionId: undefined,
                            active: true,
                            rules: {
                                defaultDecision: "ALLOW",
                                requireApprovalOnRisk: ["RED"],
                                toolPolicies: {
                                    shell: "NEEDS_APPROVAL",
                                    deploy: "NEEDS_APPROVAL",
                                    delete_file: "DENY",
                                },
                            },
                        },
                        {
                            key: "policy:execution-v2",
                            name: "Execution Engine v2 Restrictions",
                            priority: 120,
                            templateId: templateBySlug.get("mc-execution")._id,
                            versionId: approvedVersionByTemplate.get("mc-execution")._id,
                            active: true,
                            rules: {
                                defaultDecision: "ALLOW",
                                toolPolicies: {
                                    shell: "NEEDS_APPROVAL",
                                    write_file: "NEEDS_APPROVAL",
                                    message_external: "DENY",
                                },
                            },
                        },
                        {
                            key: "policy:research-relaxed",
                            name: "Research Sandbox",
                            priority: 20,
                            templateId: templateBySlug.get("mc-research")._id,
                            versionId: approvedVersionByTemplate.get("mc-research")._id,
                            active: true,
                            rules: {
                                defaultDecision: "ALLOW",
                                toolPolicies: {
                                    web_search: "ALLOW",
                                    web_fetch: "ALLOW",
                                    shell: "DENY",
                                },
                            },
                        },
                        {
                            key: "policy:legacy-disabled",
                            name: "Legacy Envelope (Disabled)",
                            priority: 10,
                            templateId: undefined,
                            versionId: undefined,
                            active: false,
                            rules: {
                                defaultDecision: "ALLOW",
                                notes: "Kept for audit/reference",
                            },
                        },
                    ];
                    _loop_5 = function (def) {
                        var existing;
                        return __generator(this, function (_16) {
                            switch (_16.label) {
                                case 0:
                                    existing = existingProjectPolicies.find(function (row) { var _a; return ((_a = row.metadata) === null || _a === void 0 ? void 0 : _a.seedKey) === def.key; });
                                    if (!existing) return [3 /*break*/, 2];
                                    return [4 /*yield*/, ctx.db.patch(existing._id, {
                                            active: def.active,
                                            priority: def.priority,
                                            rules: def.rules,
                                            updatedAt: now,
                                            templateId: def.templateId,
                                            versionId: def.versionId,
                                        })];
                                case 1:
                                    _16.sent();
                                    return [3 /*break*/, 4];
                                case 2: return [4 /*yield*/, ctx.db.insert("policyEnvelopes", {
                                        tenantId: tenant._id,
                                        projectId: project._id,
                                        templateId: def.templateId,
                                        versionId: def.versionId,
                                        name: def.name,
                                        active: def.active,
                                        priority: def.priority,
                                        rules: def.rules,
                                        createdAt: now - 2 * DAY,
                                        updatedAt: now - 1 * HOUR,
                                        metadata: withSeedMeta(def.key),
                                    })];
                                case 3:
                                    _16.sent();
                                    _16.label = 4;
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    _f = 0, policyDefs_1 = policyDefs;
                    _8.label = 53;
                case 53:
                    if (!(_f < policyDefs_1.length)) return [3 /*break*/, 56];
                    def = policyDefs_1[_f];
                    return [5 /*yield**/, _loop_5(def)];
                case 54:
                    _8.sent();
                    _8.label = 55;
                case 55:
                    _f++;
                    return [3 /*break*/, 53];
                case 56: return [4 /*yield*/, ctx.db
                        .query("deployments")
                        .withIndex("by_tenant", function (q) { return q.eq("tenantId", tenant._id); })
                        .collect()];
                case 57:
                    deploymentsByTenant = _8.sent();
                    deploymentDefs = [
                        {
                            key: "deployment:execution-prod-active",
                            templateSlug: "mc-execution",
                            envId: envProd._id,
                            targetVersion: 2,
                            previousVersion: 1,
                            status: "ACTIVE",
                        },
                        {
                            key: "deployment:execution-staging-pending",
                            templateSlug: "mc-execution",
                            envId: envStaging._id,
                            targetVersion: 3,
                            previousVersion: 2,
                            status: "PENDING",
                        },
                        {
                            key: "deployment:policy-prod-active",
                            templateSlug: "mc-policy",
                            envId: envProd._id,
                            targetVersion: 2,
                            previousVersion: 1,
                            status: "ACTIVE",
                        },
                        {
                            key: "deployment:policy-staging-rollback",
                            templateSlug: "mc-policy",
                            envId: envStaging._id,
                            targetVersion: 1,
                            previousVersion: 2,
                            status: "ROLLING_BACK",
                        },
                        {
                            key: "deployment:release-prod-retired",
                            templateSlug: "mc-release",
                            envId: envProd._id,
                            targetVersion: 1,
                            previousVersion: undefined,
                            status: "RETIRED",
                        },
                    ];
                    _loop_6 = function (i) {
                        var def, template, targetVersion, previousVersion, existing, payload;
                        return __generator(this, function (_17) {
                            switch (_17.label) {
                                case 0:
                                    def = deploymentDefs[i];
                                    template = templateBySlug.get(def.templateSlug);
                                    targetVersion = versionByTemplateAndVersion.get("".concat(def.templateSlug, ":").concat(def.targetVersion));
                                    previousVersion = def.previousVersion
                                        ? versionByTemplateAndVersion.get("".concat(def.templateSlug, ":").concat(def.previousVersion))
                                        : undefined;
                                    existing = deploymentsByTenant.find(function (row) { var _a; return ((_a = row.metadata) === null || _a === void 0 ? void 0 : _a.seedKey) === def.key; });
                                    payload = {
                                        tenantId: tenant._id,
                                        templateId: template._id,
                                        environmentId: def.envId,
                                        targetVersionId: targetVersion._id,
                                        previousVersionId: previousVersion === null || previousVersion === void 0 ? void 0 : previousVersion._id,
                                        rolloutPolicy: {
                                            strategy: i % 2 === 0 ? "all_at_once" : "canary",
                                            maxUnavailable: i % 2 === 0 ? 0 : 1,
                                        },
                                        status: def.status,
                                        createdBy: operators.maya._id,
                                        approvedBy: def.status === "PENDING" ? undefined : operators.rene._id,
                                        activatedAt: def.status === "ACTIVE" ? now - (i + 1) * HOUR : undefined,
                                        createdAt: now - (i + 2) * DAY,
                                        metadata: withSeedMeta(def.key),
                                    };
                                    if (!existing) return [3 /*break*/, 2];
                                    return [4 /*yield*/, ctx.db.patch(existing._id, payload)];
                                case 1:
                                    _17.sent();
                                    return [3 /*break*/, 4];
                                case 2: return [4 /*yield*/, ctx.db.insert("deployments", payload)];
                                case 3:
                                    _17.sent();
                                    _17.label = 4;
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _8.label = 58;
                case 58:
                    if (!(i < deploymentDefs.length)) return [3 /*break*/, 61];
                    return [5 /*yield**/, _loop_6(i)];
                case 59:
                    _8.sent();
                    _8.label = 60;
                case 60:
                    i++;
                    return [3 /*break*/, 58];
                case 61:
                    taskTypes = [
                        "CONTENT",
                        "SOCIAL",
                        "EMAIL_MARKETING",
                        "CUSTOMER_RESEARCH",
                        "SEO_RESEARCH",
                        "ENGINEERING",
                        "DOCS",
                        "OPS",
                    ];
                    taskStatuses = [
                        "INBOX",
                        "ASSIGNED",
                        "IN_PROGRESS",
                        "REVIEW",
                        "NEEDS_APPROVAL",
                        "BLOCKED",
                        "FAILED",
                        "DONE",
                        "CANCELED",
                    ];
                    activeAgents = allAgents.filter(function (a) { return a.status === "ACTIVE"; });
                    taskIdByKey = new Map();
                    _loop_7 = function (epic) {
                        var key, title, type, status_6, task, taskId;
                        return __generator(this, function (_18) {
                            switch (_18.label) {
                                case 0:
                                    key = epic[0], title = epic[1], type = epic[2], status_6 = epic[3];
                                    return [4 /*yield*/, ctx.db.query("tasks").withIndex("by_idempotency", function (q) { return q.eq("idempotencyKey", key); }).first()];
                                case 1:
                                    task = _18.sent();
                                    if (!!task) return [3 /*break*/, 4];
                                    return [4 /*yield*/, ctx.db.insert("tasks", {
                                            tenantId: tenant._id,
                                            projectId: project._id,
                                            idempotencyKey: key,
                                            title: title,
                                            description: "".concat(title, " - seeded mission program"),
                                            type: type,
                                            status: status_6,
                                            priority: 1,
                                            assigneeIds: [pick(activeAgents, taskIdByKey.size)._id],
                                            reviewCycles: status_6 === "REVIEW" ? 2 : 0,
                                            actualCost: 12.75,
                                            estimatedCost: 15,
                                            source: "SEED",
                                            createdBy: "SYSTEM",
                                            createdByRef: "seedMissionControlDemo",
                                            labels: ["epic", "mission-control", "arm"],
                                            metadata: withSeedMeta(key),
                                        })];
                                case 2:
                                    taskId = _18.sent();
                                    return [4 /*yield*/, ctx.db.get(taskId)];
                                case 3:
                                    task = _18.sent();
                                    _18.label = 4;
                                case 4:
                                    taskIdByKey.set(key, task._id);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _g = 0, _h = [
                        ["task:epic:policy", "ARM Policy Hardening Program", "ENGINEERING", "IN_PROGRESS"],
                        ["task:epic:growth", "Growth Ops Automation Sprint", "OPS", "REVIEW"],
                        ["task:epic:reliability", "Reliability and Recovery Program", "OPS", "ASSIGNED"],
                    ];
                    _8.label = 62;
                case 62:
                    if (!(_g < _h.length)) return [3 /*break*/, 65];
                    epic = _h[_g];
                    return [5 /*yield**/, _loop_7(epic)];
                case 63:
                    _8.sent();
                    _8.label = 64;
                case 64:
                    _g++;
                    return [3 /*break*/, 62];
                case 65:
                    epicKeys = __spreadArray([], taskIdByKey.keys(), true);
                    insertedTaskIds = [];
                    _loop_8 = function (i) {
                        var key, task, status_7, type, assignee, secondAssignee, scheduleBase, parentTaskId, reviewChecklist, deliverable, workPlan, taskId;
                        return __generator(this, function (_19) {
                            switch (_19.label) {
                                case 0:
                                    key = "task:item:".concat(i + 1);
                                    return [4 /*yield*/, ctx.db.query("tasks").withIndex("by_idempotency", function (q) { return q.eq("idempotencyKey", key); }).first()];
                                case 1:
                                    task = _19.sent();
                                    if (!!task) return [3 /*break*/, 4];
                                    status_7 = pick(__spreadArray([], taskStatuses, true), i);
                                    type = pick(__spreadArray([], taskTypes, true), i);
                                    assignee = pick(activeAgents, i);
                                    secondAssignee = i % 9 === 0 ? pick(activeAgents, i + 1)._id : undefined;
                                    scheduleBase = now - (i % 6) * DAY + (i % 10) * HOUR;
                                    parentTaskId = i < 27 ? taskIdByKey.get(pick(epicKeys, i)) : undefined;
                                    reviewChecklist = status_7 === "REVIEW" || status_7 === "DONE"
                                        ? {
                                            type: "quality_gate",
                                            items: [
                                                { label: "Scope complete", checked: true },
                                                { label: "Policy compliant", checked: i % 4 !== 0 },
                                                { label: "Audit trail attached", checked: i % 5 !== 0 },
                                            ],
                                        }
                                        : undefined;
                                    deliverable = status_7 === "REVIEW" || status_7 === "DONE"
                                        ? {
                                            summary: "Deliverable package ".concat(i + 1),
                                            content: "Artifacts and notes for item ".concat(i + 1),
                                            artifactIds: ["artifact-".concat(i + 1, "-a"), "artifact-".concat(i + 1, "-b")],
                                        }
                                        : undefined;
                                    workPlan = status_7 === "IN_PROGRESS" || status_7 === "REVIEW" || status_7 === "BLOCKED"
                                        ? {
                                            bullets: [
                                                "Gather context and constraints",
                                                "Execute implementation path",
                                                "Validate quality and governance checks",
                                            ],
                                            estimatedCost: 0.5 + (i % 7) * 0.2,
                                            estimatedDuration: "".concat(45 + (i % 4) * 15, " minutes"),
                                        }
                                        : undefined;
                                    return [4 /*yield*/, ctx.db.insert("tasks", {
                                            tenantId: tenant._id,
                                            projectId: project._id,
                                            idempotencyKey: key,
                                            title: "MC Task ".concat(String(i + 1).padStart(2, "0"), " \u00B7 ").concat(type, " \u00B7 ").concat(status_7),
                                            description: "Seeded task ".concat(i + 1, " for Mission Control view coverage"),
                                            type: type,
                                            status: status_7,
                                            priority: ((i % 4) + 1),
                                            assigneeIds: status_7 === "INBOX" || status_7 === "CANCELED" ? [] : __spreadArray([assignee._id], (secondAssignee ? [secondAssignee] : []), true),
                                            assigneeInstanceIds: status_7 === "INBOX" || status_7 === "CANCELED"
                                                ? []
                                                : __spreadArray([(_3 = instanceByAgentId.get(assignee._id)) === null || _3 === void 0 ? void 0 : _3._id], (secondAssignee ? [(_4 = instanceByAgentId.get(secondAssignee)) === null || _4 === void 0 ? void 0 : _4._id] : []), true).filter(Boolean),
                                            reviewerId: status_7 === "REVIEW" ? pick(activeAgents, i + 2)._id : undefined,
                                            parentTaskId: parentTaskId,
                                            workPlan: workPlan,
                                            deliverable: deliverable,
                                            reviewChecklist: reviewChecklist,
                                            reviewCycles: status_7 === "REVIEW" ? 1 + (i % 2) : 0,
                                            estimatedCost: 0.8 + (i % 9) * 0.35,
                                            actualCost: 0.25 + (i % 8) * 0.22,
                                            dueAt: now + ((i % 14) - 7) * DAY,
                                            startedAt: ["IN_PROGRESS", "REVIEW", "BLOCKED", "FAILED", "DONE"].includes(status_7)
                                                ? now - ((i % 4) + 1) * HOUR
                                                : undefined,
                                            submittedAt: ["REVIEW", "DONE"].includes(status_7) ? now - (i % 4) * HOUR : undefined,
                                            completedAt: status_7 === "DONE" ? now - (i % 18) * HOUR : undefined,
                                            scheduledFor: i % 3 === 0 ? scheduleBase : undefined,
                                            recurrence: i % 11 === 0
                                                ? {
                                                    frequency: i % 2 === 0 ? "DAILY" : "WEEKLY",
                                                    interval: i % 2 === 0 ? 1 : 2,
                                                    daysOfWeek: i % 2 === 0 ? undefined : [1, 3, 5],
                                                    endDate: now + 30 * DAY,
                                                }
                                                : undefined,
                                            labels: [
                                                "mission-control",
                                                "wave-".concat(Math.floor(i / 9) + 1),
                                                type.toLowerCase(),
                                                status_7.toLowerCase(),
                                            ],
                                            blockedReason: status_7 === "BLOCKED" ? "Awaiting upstream dependency and operator review" : undefined,
                                            source: "SEED",
                                            sourceRef: "seed://".concat(key),
                                            createdBy: "SYSTEM",
                                            createdByRef: "seedMissionControlDemo",
                                            metadata: withSeedMeta(key),
                                        })];
                                case 2:
                                    taskId = _19.sent();
                                    return [4 /*yield*/, ctx.db.get(taskId)];
                                case 3:
                                    task = _19.sent();
                                    _19.label = 4;
                                case 4:
                                    taskIdByKey.set(key, task._id);
                                    insertedTaskIds.push(task._id);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _8.label = 66;
                case 66:
                    if (!(i < 54)) return [3 /*break*/, 69];
                    return [5 /*yield**/, _loop_8(i)];
                case 67:
                    _8.sent();
                    _8.label = 68;
                case 68:
                    i++;
                    return [3 /*break*/, 66];
                case 69:
                    transitionActorPool = [allAgents[0], allAgents[1], allAgents[2]];
                    _loop_9 = function (i) {
                        var taskId, task, transitionKey, existingTransition, actor;
                        return __generator(this, function (_20) {
                            switch (_20.label) {
                                case 0:
                                    taskId = insertedTaskIds[i];
                                    return [4 /*yield*/, ctx.db.get(taskId)];
                                case 1:
                                    task = _20.sent();
                                    if (!task || task.status === "INBOX")
                                        return [2 /*return*/, "continue"];
                                    transitionKey = "transition:".concat((_5 = task.idempotencyKey) !== null && _5 !== void 0 ? _5 : taskId, ":to:").concat(task.status);
                                    return [4 /*yield*/, ctx.db
                                            .query("taskTransitions")
                                            .withIndex("by_idempotency", function (q) { return q.eq("idempotencyKey", transitionKey); })
                                            .first()];
                                case 2:
                                    existingTransition = _20.sent();
                                    if (!!existingTransition) return [3 /*break*/, 4];
                                    actor = pick(transitionActorPool, i);
                                    return [4 /*yield*/, ctx.db.insert("taskTransitions", {
                                            tenantId: tenant._id,
                                            projectId: project._id,
                                            idempotencyKey: transitionKey,
                                            taskId: taskId,
                                            fromStatus: "INBOX",
                                            toStatus: task.status,
                                            actorType: "AGENT",
                                            actorAgentId: actor._id,
                                            reason: "Seeded status placement",
                                            sessionKey: "seed-session-".concat(Math.floor(i / 6)),
                                        })];
                                case 3:
                                    _20.sent();
                                    _20.label = 4;
                                case 4: return [4 /*yield*/, ctx.db.insert("taskEvents", {
                                        tenantId: tenant._id,
                                        projectId: project._id,
                                        taskId: taskId,
                                        eventType: "TASK_CREATED",
                                        actorType: "SYSTEM",
                                        actorId: "seedMissionControlDemo",
                                        timestamp: now - (insertedTaskIds.length - i) * 10 * 60 * 1000,
                                        afterState: {
                                            status: task.status,
                                            type: task.type,
                                        },
                                        metadata: withSeedMeta("task-event:create:".concat(taskId)),
                                    })];
                                case 5:
                                    _20.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _8.label = 70;
                case 70:
                    if (!(i < insertedTaskIds.length)) return [3 /*break*/, 73];
                    return [5 /*yield**/, _loop_9(i)];
                case 71:
                    _8.sent();
                    _8.label = 72;
                case 72:
                    i++;
                    return [3 /*break*/, 70];
                case 73: return [4 /*yield*/, ctx.db.query("taskDependencies").collect()];
                case 74:
                    dependencyRows = _8.sent();
                    _loop_10 = function (i) {
                        var epicKey, parentTaskId, taskA, taskB, exists;
                        return __generator(this, function (_21) {
                            switch (_21.label) {
                                case 0:
                                    epicKey = pick(epicKeys, i);
                                    parentTaskId = taskIdByKey.get(epicKey);
                                    taskA = taskIdByKey.get("task:item:".concat(i + 1));
                                    taskB = taskIdByKey.get("task:item:".concat(i + 2));
                                    exists = dependencyRows.find(function (row) {
                                        return row.parentTaskId === parentTaskId && row.taskId === taskB && row.dependsOnTaskId === taskA;
                                    });
                                    if (!!exists) return [3 /*break*/, 2];
                                    return [4 /*yield*/, ctx.db.insert("taskDependencies", {
                                            parentTaskId: parentTaskId,
                                            taskId: taskB,
                                            dependsOnTaskId: taskA,
                                        })];
                                case 1:
                                    _21.sent();
                                    _21.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _8.label = 75;
                case 75:
                    if (!(i < 30)) return [3 /*break*/, 78];
                    return [5 /*yield**/, _loop_10(i)];
                case 76:
                    _8.sent();
                    _8.label = 77;
                case 77:
                    i++;
                    return [3 /*break*/, 75];
                case 78:
                    messageTypes = ["WORK_PLAN", "PROGRESS", "COMMENT", "ARTIFACT", "SYSTEM"];
                    messageIds = [];
                    _loop_11 = function (i) {
                        var taskId, agent, instance, type, idempotencyKey, existing, id;
                        return __generator(this, function (_22) {
                            switch (_22.label) {
                                case 0:
                                    taskId = pick(insertedTaskIds, i);
                                    agent = pick(activeAgents, i);
                                    instance = instanceByAgentId.get(agent._id);
                                    type = pick(__spreadArray([], messageTypes, true), i);
                                    idempotencyKey = "message:".concat(i + 1);
                                    return [4 /*yield*/, ctx.db
                                            .query("messages")
                                            .withIndex("by_idempotency", function (q) { return q.eq("idempotencyKey", idempotencyKey); })
                                            .first()];
                                case 1:
                                    existing = _22.sent();
                                    if (existing) {
                                        messageIds.push(existing._id);
                                        return [2 /*return*/, "continue"];
                                    }
                                    return [4 /*yield*/, ctx.db.insert("messages", {
                                            tenantId: tenant._id,
                                            projectId: project._id,
                                            idempotencyKey: idempotencyKey,
                                            taskId: taskId,
                                            authorType: i % 7 === 0 ? "HUMAN" : "AGENT",
                                            authorAgentId: i % 7 === 0 ? undefined : agent._id,
                                            authorInstanceId: i % 7 === 0 ? undefined : instance === null || instance === void 0 ? void 0 : instance._id,
                                            authorUserId: i % 7 === 0 ? "operator" : undefined,
                                            type: type,
                                            content: type === "WORK_PLAN"
                                                ? "Plan ".concat(i + 1, ": define scope, execute path, validate outcomes")
                                                : type === "PROGRESS"
                                                    ? "Progress update ".concat(i + 1, ": execution moving forward with no blockers")
                                                    : type === "ARTIFACT"
                                                        ? "Artifact drop ".concat(i + 1, ": attached logs and output snapshots")
                                                        : type === "SYSTEM"
                                                            ? "System note ".concat(i + 1, ": automated coordination signal")
                                                            : "Thread comment ".concat(i + 1, ": coordination note and clarification"),
                                            artifacts: type === "ARTIFACT"
                                                ? [
                                                    { name: "artifact-".concat(i + 1, ".md"), type: "text/markdown", url: "https://example.com/artifacts/".concat(i + 1) },
                                                    { name: "trace-".concat(i + 1, ".json"), type: "application/json" },
                                                ]
                                                : undefined,
                                            mentions: i % 8 === 0 ? ["@MC Atlas", "@MC Orbit"] : undefined,
                                            metadata: withSeedMeta("message:".concat(i + 1)),
                                        })];
                                case 2:
                                    id = _22.sent();
                                    messageIds.push(id);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _8.label = 79;
                case 79:
                    if (!(i < 110)) return [3 /*break*/, 82];
                    return [5 /*yield**/, _loop_11(i)];
                case 80:
                    _8.sent();
                    _8.label = 81;
                case 81:
                    i++;
                    return [3 /*break*/, 79];
                case 82:
                    runIds = [];
                    _loop_12 = function (i) {
                        var taskId, assignee, instance, runStatus, startedAt, endedAt, runIdempotency, existing, id;
                        return __generator(this, function (_23) {
                            switch (_23.label) {
                                case 0:
                                    taskId = pick(insertedTaskIds, i);
                                    assignee = pick(activeAgents, i);
                                    instance = instanceByAgentId.get(assignee._id);
                                    runStatus = i % 9 === 0 ? "FAILED" : i % 7 === 0 ? "RUNNING" : "COMPLETED";
                                    startedAt = now - (i + 1) * 25 * 60 * 1000;
                                    endedAt = runStatus === "RUNNING" ? undefined : startedAt + (5 + (i % 20)) * 60 * 1000;
                                    runIdempotency = "run:".concat(i + 1);
                                    return [4 /*yield*/, ctx.db
                                            .query("runs")
                                            .withIndex("by_idempotency", function (q) { return q.eq("idempotencyKey", runIdempotency); })
                                            .first()];
                                case 1:
                                    existing = _23.sent();
                                    if (existing) {
                                        runIds.push(existing._id);
                                        return [2 /*return*/, "continue"];
                                    }
                                    return [4 /*yield*/, ctx.db.insert("runs", {
                                            tenantId: tenant._id,
                                            projectId: project._id,
                                            idempotencyKey: runIdempotency,
                                            agentId: assignee._id,
                                            instanceId: instance === null || instance === void 0 ? void 0 : instance._id,
                                            versionId: instance === null || instance === void 0 ? void 0 : instance.versionId,
                                            templateId: instance === null || instance === void 0 ? void 0 : instance.templateId,
                                            taskId: taskId,
                                            sessionKey: "mc-session-".concat(Math.floor(i / 4) + 1),
                                            startedAt: startedAt,
                                            endedAt: endedAt,
                                            durationMs: endedAt ? endedAt - startedAt : undefined,
                                            model: assignee.role === "LEAD" || assignee.role === "CEO" ? "gpt-5" : "gpt-4.1-mini",
                                            inputTokens: 250 + i * 5,
                                            outputTokens: 480 + i * 7,
                                            cacheReadTokens: 50 + (i % 10) * 3,
                                            cacheWriteTokens: 20 + (i % 8) * 2,
                                            costUsd: 0.08 + (i % 11) * 0.03,
                                            budgetAllocated: 0.4 + (i % 7) * 0.1,
                                            status: runStatus,
                                            error: runStatus === "FAILED" ? "Synthetic failure ".concat(i + 1, ": timeout during tool execution") : undefined,
                                            metadata: withSeedMeta("run:".concat(i + 1)),
                                        })];
                                case 2:
                                    id = _23.sent();
                                    runIds.push(id);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _8.label = 83;
                case 83:
                    if (!(i < 52)) return [3 /*break*/, 86];
                    return [5 /*yield**/, _loop_12(i)];
                case 84:
                    _8.sent();
                    _8.label = 85;
                case 85:
                    i++;
                    return [3 /*break*/, 83];
                case 86:
                    toolCallIds = [];
                    tools = ["shell", "web_search", "write_file", "read_file", "deploy", "message_external"];
                    i = 0;
                    _8.label = 87;
                case 87:
                    if (!(i < runIds.length * 2)) return [3 /*break*/, 91];
                    runId = pick(runIds, i);
                    return [4 /*yield*/, ctx.db.get(runId)];
                case 88:
                    run_1 = _8.sent();
                    if (!run_1)
                        return [3 /*break*/, 90];
                    toolName = pick(tools, i);
                    riskLevel = toolName === "deploy" || toolName === "message_external" ? "RED" : toolName === "shell" ? "YELLOW" : "GREEN";
                    status_1 = riskLevel === "RED" && i % 3 === 0
                        ? "DENIED"
                        : i % 11 === 0
                            ? "FAILED"
                            : i % 7 === 0
                                ? "RUNNING"
                                : "SUCCESS";
                    startedAt = run_1.startedAt + (i % 5) * 60 * 1000;
                    endedAt = status_1 === "RUNNING" ? undefined : startedAt + (20 + (i % 90)) * 1000;
                    return [4 /*yield*/, ctx.db.insert("toolCalls", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            runId: run_1._id,
                            agentId: run_1.agentId,
                            instanceId: run_1.instanceId,
                            versionId: run_1.versionId,
                            taskId: run_1.taskId,
                            toolName: toolName,
                            toolVersion: "1.0.0",
                            riskLevel: riskLevel,
                            policyResult: status_1 === "DENIED"
                                ? { decision: "DENY", reason: "Blocked by envelope", approvalId: undefined }
                                : riskLevel === "RED"
                                    ? { decision: "NEEDS_APPROVAL", reason: "High risk", approvalId: "approval:".concat(i + 1) }
                                    : { decision: "ALLOW", reason: "Within guardrails", approvalId: undefined },
                            inputPreview: "input payload ".concat(i + 1),
                            outputPreview: status_1 === "SUCCESS" ? "output payload ".concat(i + 1) : undefined,
                            inputHash: "in-".concat(i + 1),
                            outputHash: status_1 === "SUCCESS" ? "out-".concat(i + 1) : undefined,
                            startedAt: startedAt,
                            endedAt: endedAt,
                            durationMs: endedAt ? endedAt - startedAt : undefined,
                            status: status_1,
                            error: status_1 === "FAILED" ? "Runtime command failure" : status_1 === "DENIED" ? "Policy denied" : undefined,
                            retryCount: i % 4,
                        })];
                case 89:
                    id = _8.sent();
                    toolCallIds.push(id);
                    _8.label = 90;
                case 90:
                    i++;
                    return [3 /*break*/, 87];
                case 91:
                    approvalIds = [];
                    approvalRecordIds = [];
                    i = 0;
                    _8.label = 92;
                case 92:
                    if (!(i < 26)) return [3 /*break*/, 96];
                    agent = pick(activeAgents, i);
                    instance = instanceByAgentId.get(agent._id);
                    status_2 = i % 6 === 0 ? "DENIED" : i % 5 === 0 ? "APPROVED" : i % 7 === 0 ? "ESCALATED" : "PENDING";
                    riskLevel = i % 2 === 0 ? "RED" : "YELLOW";
                    taskId = pick(insertedTaskIds, i);
                    toolCallId = pick(toolCallIds, i);
                    return [4 /*yield*/, ctx.db.insert("approvals", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            idempotencyKey: "approval:".concat(i + 1),
                            taskId: taskId,
                            toolCallId: toolCallId,
                            requestorAgentId: agent._id,
                            actionType: i % 3 === 0 ? "DEPLOY" : i % 3 === 1 ? "SHELL_EXEC" : "EXTERNAL_MESSAGE",
                            actionSummary: "Approval request ".concat(i + 1, ": high-impact operation"),
                            riskLevel: riskLevel,
                            actionPayload: { sample: true, index: i + 1 },
                            estimatedCost: 0.75 + (i % 7) * 0.5,
                            rollbackPlan: "Revert deployment and restore previous stable build",
                            justification: "Approval rationale ".concat(i + 1, ": required for mission-critical change"),
                            status: status_2,
                            decidedByAgentId: status_2 === "APPROVED" ? pick(activeAgents, i + 1)._id : undefined,
                            decidedByUserId: status_2 === "DENIED" ? "operator" : undefined,
                            decidedAt: status_2 === "PENDING" || status_2 === "ESCALATED" ? undefined : now - (i + 1) * 30 * 60 * 1000,
                            decisionReason: status_2 === "APPROVED" ? "Approved after validation" : status_2 === "DENIED" ? "Denied due to risk exposure" : undefined,
                            firstDecisionByUserId: riskLevel === "RED" && status_2 === "APPROVED" ? "operator" : undefined,
                            firstDecisionAt: riskLevel === "RED" && status_2 === "APPROVED" ? now - (i + 2) * 45 * 60 * 1000 : undefined,
                            firstDecisionReason: riskLevel === "RED" && status_2 === "APPROVED" ? "Dual-control first pass" : undefined,
                            escalationLevel: status_2 === "ESCALATED" ? 1 : 0,
                            escalatedAt: status_2 === "ESCALATED" ? now - (i + 1) * 20 * 60 * 1000 : undefined,
                            escalatedBy: status_2 === "ESCALATED" ? "system" : undefined,
                            escalationReason: status_2 === "ESCALATED" ? "SLA threshold exceeded" : undefined,
                            requiredDecisionCount: riskLevel === "RED" ? 2 : 1,
                            decisionCount: status_2 === "APPROVED" ? (riskLevel === "RED" ? 2 : 1) : status_2 === "DENIED" ? 1 : 0,
                            expiresAt: now + (3 + (i % 5)) * HOUR,
                        })];
                case 93:
                    approvalId = _8.sent();
                    approvalIds.push(approvalId);
                    return [4 /*yield*/, ctx.db.insert("approvalRecords", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            instanceId: instance === null || instance === void 0 ? void 0 : instance._id,
                            versionId: instance === null || instance === void 0 ? void 0 : instance.versionId,
                            legacyApprovalId: approvalId,
                            actionType: i % 3 === 0 ? "DEPLOY" : i % 3 === 1 ? "SHELL_EXEC" : "EXTERNAL_MESSAGE",
                            riskLevel: riskLevel,
                            rollbackPlan: "Rollback playbook documented",
                            justification: "ARM approval record ".concat(i + 1),
                            escalationLevel: status_2 === "ESCALATED" ? 1 : 0,
                            status: status_2 === "ESCALATED" ? "PENDING" : status_2 === "APPROVED" ? "APPROVED" : status_2 === "DENIED" ? "DENIED" : "PENDING",
                            requestedBy: pick([operators.maya._id, operators.rene._id, operators.iris._id], i),
                            requestedAt: now - (i + 1) * HOUR,
                            decidedBy: status_2 === "APPROVED" || status_2 === "DENIED" ? operators.rene._id : undefined,
                            decidedAt: status_2 === "APPROVED" || status_2 === "DENIED" ? now - i * 30 * 60 * 1000 : undefined,
                            decisionReason: status_2 === "APPROVED" ? "Compliant" : status_2 === "DENIED" ? "Policy conflict" : undefined,
                            metadata: withSeedMeta("approval-record:".concat(i + 1)),
                        })];
                case 94:
                    approvalRecordId = _8.sent();
                    approvalRecordIds.push(approvalRecordId);
                    _8.label = 95;
                case 95:
                    i++;
                    return [3 /*break*/, 92];
                case 96:
                    coordinatorActions = [
                        "COORDINATOR_TASK_DECOMPOSED",
                        "COORDINATOR_DELEGATED",
                        "COORDINATOR_REBALANCED",
                        "COORDINATOR_ESCALATED",
                        "COORDINATOR_LOOP_DETECTED",
                        "COORDINATOR_BUDGET_WARNING",
                        "COORDINATOR_CONFLICT_RESOLVED",
                        "COORDINATOR_STANDUP_COMPILED",
                        "COORDINATOR_ROUTING_UPDATED",
                    ];
                    i = 0;
                    _8.label = 97;
                case 97:
                    if (!(i < 180)) return [3 /*break*/, 100];
                    agent = pick(allAgents, i);
                    taskId = pick(insertedTaskIds, i);
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            actorType: i % 5 === 0 ? "SYSTEM" : i % 4 === 0 ? "HUMAN" : "AGENT",
                            actorId: i % 4 === 0 ? "operator" : agent._id,
                            action: i % 3 === 0 ? pick(coordinatorActions, i) : "MISSION_ACTIVITY",
                            description: i % 3 === 0
                                ? "Coordinator event ".concat(i + 1, ": ").concat(pick(coordinatorActions, i))
                                : "Activity ".concat(i + 1, ": execution and collaboration update"),
                            targetType: "TASK",
                            targetId: taskId,
                            taskId: taskId,
                            agentId: agent._id,
                            metadata: withSeedMeta("activity:".concat(i + 1)),
                        })];
                case 98:
                    _8.sent();
                    _8.label = 99;
                case 99:
                    i++;
                    return [3 /*break*/, 97];
                case 100:
                    i = 0;
                    _8.label = 101;
                case 101:
                    if (!(i < 28)) return [3 /*break*/, 104];
                    taskId = pick(insertedTaskIds, i);
                    runId = pick(runIds, i);
                    agent = pick(allAgents, i);
                    status_3 = i % 4 === 0 ? "OPEN" : i % 4 === 1 ? "ACKNOWLEDGED" : i % 4 === 2 ? "RESOLVED" : "IGNORED";
                    return [4 /*yield*/, ctx.db.insert("alerts", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            severity: i % 10 === 0 ? "CRITICAL" : i % 6 === 0 ? "ERROR" : i % 3 === 0 ? "WARNING" : "INFO",
                            type: i % 2 === 0 ? "POLICY_EVENT" : "RUNTIME_EVENT",
                            title: "Alert ".concat(i + 1, ": ").concat(i % 2 === 0 ? "Policy gate triggered" : "Runtime anomaly detected"),
                            description: "Synthetic alert payload ".concat(i + 1, " for UI validation"),
                            agentId: agent._id,
                            taskId: taskId,
                            runId: runId,
                            status: status_3,
                            acknowledgedBy: status_3 === "ACKNOWLEDGED" ? "operator" : undefined,
                            acknowledgedAt: status_3 === "ACKNOWLEDGED" ? now - i * 5 * 60 * 1000 : undefined,
                            resolvedAt: status_3 === "RESOLVED" ? now - i * 8 * 60 * 1000 : undefined,
                            resolutionNote: status_3 === "RESOLVED" ? "Handled and monitored" : status_3 === "IGNORED" ? "False positive" : undefined,
                            metadata: withSeedMeta("alert:".concat(i + 1)),
                        })];
                case 102:
                    _8.sent();
                    _8.label = 103;
                case 103:
                    i++;
                    return [3 /*break*/, 101];
                case 104:
                    i = 0;
                    _8.label = 105;
                case 105:
                    if (!(i < allAgents.length * 8)) return [3 /*break*/, 108];
                    recipient = pick(allAgents, i);
                    return [4 /*yield*/, ctx.db.insert("notifications", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            agentId: recipient._id,
                            type: pick(["MENTION", "TASK_ASSIGNED", "TASK_TRANSITION", "APPROVAL_REQUESTED", "APPROVAL_DECIDED", "SYSTEM"], i),
                            title: "Notification ".concat(i + 1, " for ").concat(recipient.name),
                            body: "Seeded notification event ".concat(i + 1),
                            taskId: pick(insertedTaskIds, i),
                            messageId: pick(messageIds, i),
                            approvalId: pick(approvalIds, i),
                            fromAgentId: pick(allAgents, i + 1)._id,
                            fromUserId: i % 9 === 0 ? "operator" : undefined,
                            readAt: i % 3 === 0 ? now - i * 60 * 1000 : undefined,
                            metadata: withSeedMeta("notification:".concat(i + 1)),
                        })];
                case 106:
                    _8.sent();
                    _8.label = 107;
                case 107:
                    i++;
                    return [3 /*break*/, 105];
                case 108:
                    i = 0;
                    _8.label = 109;
                case 109:
                    if (!(i < 32)) return [3 /*break*/, 112];
                    taskId = pick(insertedTaskIds, i);
                    agent = pick(allAgents, i);
                    return [4 /*yield*/, ctx.db.insert("captures", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            taskId: taskId,
                            agentId: agent._id,
                            title: "Capture ".concat(i + 1),
                            description: "Visual artifact ".concat(i + 1, " for task traceability"),
                            type: pick(["SCREENSHOT", "DIAGRAM", "MOCKUP", "CHART", "VIDEO", "OTHER"], i),
                            url: "https://example.com/captures/".concat(i + 1, ".png"),
                            thumbnailUrl: "https://example.com/captures/".concat(i + 1, "-thumb.png"),
                            width: 1280,
                            height: 720,
                            fileSize: 250000 + i * 1000,
                            mimeType: "image/png",
                            tags: ["mission-control", "seed", "capture-".concat(i + 1)],
                            capturedAt: now - i * 2 * HOUR,
                            metadata: withSeedMeta("capture:".concat(i + 1)),
                        })];
                case 110:
                    _8.sent();
                    _8.label = 111;
                case 111:
                    i++;
                    return [3 /*break*/, 109];
                case 112:
                    _loop_13 = function (i) {
                        var agent, docs, _loop_16, _24, docs_1, doc, _loop_17, _25, _26, taskType, patterns, _loop_18, p;
                        return __generator(this, function (_27) {
                            switch (_27.label) {
                                case 0:
                                    agent = allAgents[i];
                                    docs = [
                                        {
                                            type: "WORKING_MD",
                                            content: "# ".concat(agent.name, " Working\n\n- Active objective: deliver mission outcomes\n- Current queue depth: ").concat(2 + (i % 4), "\n- Next checkpoint: in ").concat(30 + i * 3, " minutes"),
                                        },
                                        {
                                            type: "DAILY_NOTE",
                                            content: "# Daily Note\n\n- Focus area: ".concat(pick(__spreadArray([], taskTypes, true), i), "\n- Risks: ").concat(i % 5 === 0 ? "Policy lock" : "None", "\n- Alignment: green"),
                                        },
                                        {
                                            type: "SESSION_MEMORY",
                                            content: "# Session Memory\n\n- Preferred flow: explicit -> verify -> report\n- Last major action: seeded session ".concat(i + 1, "\n- Guidance: keep operator informed"),
                                        },
                                    ];
                                    _loop_16 = function (doc) {
                                        var existing;
                                        return __generator(this, function (_28) {
                                            switch (_28.label) {
                                                case 0: return [4 /*yield*/, ctx.db
                                                        .query("agentDocuments")
                                                        .withIndex("by_agent_type", function (q) { return q.eq("agentId", agent._id).eq("type", doc.type); })
                                                        .first()];
                                                case 1:
                                                    existing = _28.sent();
                                                    if (!existing) return [3 /*break*/, 3];
                                                    return [4 /*yield*/, ctx.db.patch(existing._id, {
                                                            tenantId: tenant._id,
                                                            projectId: project._id,
                                                            content: doc.content,
                                                            updatedAt: now - i * 20 * 60 * 1000,
                                                            metadata: withSeedMeta("doc:".concat(agent.name, ":").concat(doc.type)),
                                                        })];
                                                case 2:
                                                    _28.sent();
                                                    return [3 /*break*/, 5];
                                                case 3: return [4 /*yield*/, ctx.db.insert("agentDocuments", {
                                                        tenantId: tenant._id,
                                                        projectId: project._id,
                                                        agentId: agent._id,
                                                        type: doc.type,
                                                        content: doc.content,
                                                        updatedAt: now - i * 20 * 60 * 1000,
                                                        metadata: withSeedMeta("doc:".concat(agent.name, ":").concat(doc.type)),
                                                    })];
                                                case 4:
                                                    _28.sent();
                                                    _28.label = 5;
                                                case 5: return [2 /*return*/];
                                            }
                                        });
                                    };
                                    _24 = 0, docs_1 = docs;
                                    _27.label = 1;
                                case 1:
                                    if (!(_24 < docs_1.length)) return [3 /*break*/, 4];
                                    doc = docs_1[_24];
                                    return [5 /*yield**/, _loop_16(doc)];
                                case 2:
                                    _27.sent();
                                    _27.label = 3;
                                case 3:
                                    _24++;
                                    return [3 /*break*/, 1];
                                case 4:
                                    _loop_17 = function (taskType) {
                                        var perf;
                                        return __generator(this, function (_29) {
                                            switch (_29.label) {
                                                case 0: return [4 /*yield*/, ctx.db
                                                        .query("agentPerformance")
                                                        .withIndex("by_agent_type", function (q) { return q.eq("agentId", agent._id).eq("taskType", taskType); })
                                                        .first()];
                                                case 1:
                                                    perf = _29.sent();
                                                    if (!perf) return [3 /*break*/, 3];
                                                    return [4 /*yield*/, ctx.db.patch(perf._id, {
                                                            tenantId: tenant._id,
                                                            projectId: project._id,
                                                            successCount: 8 + i,
                                                            failureCount: i % 4,
                                                            avgCompletionTimeMs: (15 + i) * 60 * 1000,
                                                            avgCostUsd: 0.2 + (i % 5) * 0.09,
                                                            totalTasksCompleted: 12 + i,
                                                            lastUpdatedAt: now - i * HOUR,
                                                        })];
                                                case 2:
                                                    _29.sent();
                                                    return [3 /*break*/, 5];
                                                case 3: return [4 /*yield*/, ctx.db.insert("agentPerformance", {
                                                        tenantId: tenant._id,
                                                        agentId: agent._id,
                                                        projectId: project._id,
                                                        taskType: taskType,
                                                        successCount: 8 + i,
                                                        failureCount: i % 4,
                                                        avgCompletionTimeMs: (15 + i) * 60 * 1000,
                                                        avgCostUsd: 0.2 + (i % 5) * 0.09,
                                                        totalTasksCompleted: 12 + i,
                                                        lastUpdatedAt: now - i * HOUR,
                                                    })];
                                                case 4:
                                                    _29.sent();
                                                    _29.label = 5;
                                                case 5: return [2 /*return*/];
                                            }
                                        });
                                    };
                                    _25 = 0, _26 = ["ENGINEERING", "OPS", "DOCS"];
                                    _27.label = 5;
                                case 5:
                                    if (!(_25 < _26.length)) return [3 /*break*/, 8];
                                    taskType = _26[_25];
                                    return [5 /*yield**/, _loop_17(taskType)];
                                case 6:
                                    _27.sent();
                                    _27.label = 7;
                                case 7:
                                    _25++;
                                    return [3 /*break*/, 5];
                                case 8:
                                    patterns = [
                                        "strength:".concat(pick(__spreadArray([], taskTypes, true), i)),
                                        "weakness:".concat(pick(__spreadArray([], taskTypes, true), i + 2)),
                                    ];
                                    _loop_18 = function (p) {
                                        var pattern, existing;
                                        return __generator(this, function (_30) {
                                            switch (_30.label) {
                                                case 0:
                                                    pattern = patterns[p];
                                                    return [4 /*yield*/, ctx.db
                                                            .query("agentPatterns")
                                                            .withIndex("by_agent_pattern", function (q) { return q.eq("agentId", agent._id).eq("pattern", pattern); })
                                                            .first()];
                                                case 1:
                                                    existing = _30.sent();
                                                    if (!existing) return [3 /*break*/, 3];
                                                    return [4 /*yield*/, ctx.db.patch(existing._id, {
                                                            tenantId: tenant._id,
                                                            projectId: project._id,
                                                            confidence: 0.58 + ((i + p) % 4) * 0.09,
                                                            evidence: ["task-".concat(i + 1), "task-".concat(i + 9)],
                                                            lastSeenAt: now - i * 40 * 60 * 1000,
                                                            metadata: withSeedMeta("pattern:".concat(agent.name, ":").concat(pattern)),
                                                        })];
                                                case 2:
                                                    _30.sent();
                                                    return [3 /*break*/, 5];
                                                case 3: return [4 /*yield*/, ctx.db.insert("agentPatterns", {
                                                        tenantId: tenant._id,
                                                        agentId: agent._id,
                                                        projectId: project._id,
                                                        pattern: pattern,
                                                        confidence: 0.58 + ((i + p) % 4) * 0.09,
                                                        evidence: ["task-".concat(i + 1), "task-".concat(i + 9)],
                                                        discoveredAt: now - (i + p) * DAY,
                                                        lastSeenAt: now - i * 40 * 60 * 1000,
                                                        metadata: withSeedMeta("pattern:".concat(agent.name, ":").concat(pattern)),
                                                    })];
                                                case 4:
                                                    _30.sent();
                                                    _30.label = 5;
                                                case 5: return [2 /*return*/];
                                            }
                                        });
                                    };
                                    p = 0;
                                    _27.label = 9;
                                case 9:
                                    if (!(p < patterns.length)) return [3 /*break*/, 12];
                                    return [5 /*yield**/, _loop_18(p)];
                                case 10:
                                    _27.sent();
                                    _27.label = 11;
                                case 11:
                                    p++;
                                    return [3 /*break*/, 9];
                                case 12: return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _8.label = 113;
                case 113:
                    if (!(i < allAgents.length)) return [3 /*break*/, 116];
                    return [5 /*yield**/, _loop_13(i)];
                case 114:
                    _8.sent();
                    _8.label = 115;
                case 115:
                    i++;
                    return [3 /*break*/, 113];
                case 116:
                    threadIds = [];
                    i = 0;
                    _8.label = 117;
                case 117:
                    if (!(i < 10)) return [3 /*break*/, 120];
                    return [4 /*yield*/, ctx.db.insert("telegraphThreads", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            title: "Thread ".concat(i + 1, ": ").concat(i % 2 === 0 ? "Operations" : "Council", " updates"),
                            participants: [pick(allAgents, i)._id, pick(allAgents, i + 1)._id, "OPERATOR"],
                            channel: i % 4 === 0 ? "TELEGRAM" : "INTERNAL",
                            externalThreadRef: i % 4 === 0 ? "telegram-thread-".concat(1000 + i) : undefined,
                            linkedTaskId: pick(insertedTaskIds, i),
                            linkedApprovalId: pick(approvalIds, i),
                            linkedIncidentId: i % 5 === 0 ? "incident-".concat(i + 1) : undefined,
                            lastMessageAt: now - i * HOUR,
                            messageCount: 0,
                            metadata: withSeedMeta("thread:".concat(i + 1)),
                        })];
                case 118:
                    threadId = _8.sent();
                    threadIds.push(threadId);
                    _8.label = 119;
                case 119:
                    i++;
                    return [3 /*break*/, 117];
                case 120:
                    telegraphMessageIds = [];
                    i = 0;
                    _8.label = 121;
                case 121:
                    if (!(i < 68)) return [3 /*break*/, 124];
                    threadId = pick(threadIds, i);
                    sender = pick(allAgents, i);
                    return [4 /*yield*/, ctx.db.insert("telegraphMessages", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            threadId: threadId,
                            senderId: i % 6 === 0 ? "OPERATOR" : sender._id,
                            senderType: i % 6 === 0 ? "HUMAN" : "AGENT",
                            content: "Telegraph message ".concat(i + 1, ": coordination payload"),
                            replyToId: i > 0 && i % 5 !== 0 ? telegraphMessageIds[i - 1] : undefined,
                            channel: i % 5 === 0 ? "TELEGRAM" : "INTERNAL",
                            externalRef: i % 5 === 0 ? "tg-msg-".concat(5000 + i) : undefined,
                            status: i % 8 === 0 ? "READ" : i % 7 === 0 ? "DELIVERED" : "SENT",
                            metadata: withSeedMeta("telegraph-message:".concat(i + 1)),
                        })];
                case 122:
                    msgId = _8.sent();
                    telegraphMessageIds.push(msgId);
                    _8.label = 123;
                case 123:
                    i++;
                    return [3 /*break*/, 121];
                case 124:
                    _loop_14 = function (threadId) {
                        var messages, latest;
                        return __generator(this, function (_31) {
                            switch (_31.label) {
                                case 0: return [4 /*yield*/, ctx.db
                                        .query("telegraphMessages")
                                        .withIndex("by_thread", function (q) { return q.eq("threadId", threadId); })
                                        .collect()];
                                case 1:
                                    messages = _31.sent();
                                    latest = messages.reduce(function (max, row) { return Math.max(max, row._creationTime); }, 0);
                                    return [4 /*yield*/, ctx.db.patch(threadId, {
                                            messageCount: messages.length,
                                            lastMessageAt: latest || now,
                                        })];
                                case 2:
                                    _31.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _j = 0, threadIds_1 = threadIds;
                    _8.label = 125;
                case 125:
                    if (!(_j < threadIds_1.length)) return [3 /*break*/, 128];
                    threadId = threadIds_1[_j];
                    return [5 /*yield**/, _loop_14(threadId)];
                case 126:
                    _8.sent();
                    _8.label = 127;
                case 127:
                    _j++;
                    return [3 /*break*/, 125];
                case 128:
                    meetingIds = [];
                    i = 0;
                    _8.label = 129;
                case 129:
                    if (!(i < 12)) return [3 /*break*/, 132];
                    status_4 = i % 5 === 0 ? "CANCELLED" : i % 4 === 0 ? "COMPLETED" : i % 3 === 0 ? "IN_PROGRESS" : "SCHEDULED";
                    return [4 /*yield*/, ctx.db.insert("meetings", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            title: "Mission Meeting ".concat(i + 1),
                            agenda: "1. Review operations\n2. Decisions and approvals\n3. Risks and mitigations",
                            scheduledAt: now + (i - 5) * 6 * HOUR,
                            duration: 30 + (i % 3) * 15,
                            status: status_4,
                            hostAgentId: pick(allAgents, i)._id,
                            participants: [
                                { agentId: pick(allAgents, i)._id, orgPosition: "LEAD", role: "host" },
                                { agentId: pick(allAgents, i + 1)._id, orgPosition: "SPECIALIST", role: "attendee" },
                                { agentId: pick(allAgents, i + 2)._id, orgPosition: "SPECIALIST", role: "attendee" },
                            ],
                            provider: i % 4 === 0 ? "ZOOM" : "MANUAL",
                            externalMeetingRef: i % 4 === 0 ? "zoom-".concat(9000 + i) : undefined,
                            notesDocPath: "/notes/meeting-".concat(i + 1, ".md"),
                            notes: status_4 === "COMPLETED" ? "Meeting ".concat(i + 1, " completed with actions.") : undefined,
                            actionItems: status_4 === "COMPLETED" || status_4 === "IN_PROGRESS"
                                ? [
                                    {
                                        description: "Action item A for meeting ".concat(i + 1),
                                        assigneeAgentId: pick(allAgents, i + 3)._id,
                                        taskId: pick(insertedTaskIds, i),
                                        dueAt: now + (i + 1) * DAY,
                                        completed: i % 2 === 0,
                                    },
                                    {
                                        description: "Action item B for meeting ".concat(i + 1),
                                        assigneeAgentId: pick(allAgents, i + 4)._id,
                                        dueAt: now + (i + 2) * DAY,
                                        completed: false,
                                    },
                                ]
                                : undefined,
                            calendarPayload: JSON.stringify({
                                summary: "Mission Meeting ".concat(i + 1),
                                provider: i % 4 === 0 ? "ZOOM" : "MANUAL",
                            }),
                            metadata: withSeedMeta("meeting:".concat(i + 1)),
                        })];
                case 130:
                    meetingId = _8.sent();
                    meetingIds.push(meetingId);
                    _8.label = 131;
                case 131:
                    i++;
                    return [3 /*break*/, 129];
                case 132:
                    i = 0;
                    _8.label = 133;
                case 133:
                    if (!(i < 24)) return [3 /*break*/, 136];
                    return [4 /*yield*/, ctx.db.insert("voiceArtifacts", {
                            tenantId: tenant._id,
                            agentId: pick(allAgents, i)._id,
                            projectId: project._id,
                            text: "Voice payload ".concat(i + 1, ": mission update synthesis"),
                            transcript: "Transcript ".concat(i + 1, ": mission update synthesis"),
                            audioUrl: "https://example.com/audio/".concat(i + 1, ".mp3"),
                            provider: i % 3 === 0 ? "OTHER" : "ELEVENLABS",
                            voiceId: "voice-".concat((i % 5) + 1),
                            durationMs: 3000 + (i % 6) * 900,
                            linkedMessageId: pick(telegraphMessageIds, i),
                            linkedMeetingId: pick(meetingIds, i),
                            metadata: withSeedMeta("voice:".concat(i + 1)),
                        })];
                case 134:
                    _8.sent();
                    _8.label = 135;
                case 135:
                    i++;
                    return [3 /*break*/, 133];
                case 136:
                    changeRecordIds = [];
                    _k = 0, _l = templateBySlug.entries();
                    _8.label = 137;
                case 137:
                    if (!(_k < _l.length)) return [3 /*break*/, 140];
                    _m = _l[_k], slug = _m[0], template = _m[1];
                    return [4 /*yield*/, ctx.db.insert("changeRecords", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            templateId: template._id,
                            type: "TEMPLATE_CREATED",
                            summary: "Template seeded: ".concat(slug),
                            relatedTable: "agentTemplates",
                            relatedId: template._id,
                            timestamp: now - 30 * DAY,
                            metadata: withSeedMeta("change:template:".concat(slug)),
                        })];
                case 138:
                    changeId = _8.sent();
                    changeRecordIds.push(changeId);
                    _8.label = 139;
                case 139:
                    _k++;
                    return [3 /*break*/, 137];
                case 140:
                    _o = 0, _p = versionByTemplateAndVersion.entries();
                    _8.label = 141;
                case 141:
                    if (!(_o < _p.length)) return [3 /*break*/, 144];
                    _q = _p[_o], key = _q[0], versionDoc = _q[1];
                    return [4 /*yield*/, ctx.db.insert("changeRecords", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            templateId: versionDoc.templateId,
                            versionId: versionDoc._id,
                            type: "VERSION_CREATED",
                            summary: "Version seeded: ".concat(key),
                            relatedTable: "agentVersions",
                            relatedId: versionDoc._id,
                            timestamp: now - 20 * DAY + versionDoc.version * DAY,
                            metadata: withSeedMeta("change:version:".concat(key)),
                        })];
                case 142:
                    changeId = _8.sent();
                    changeRecordIds.push(changeId);
                    _8.label = 143;
                case 143:
                    _o++;
                    return [3 /*break*/, 141];
                case 144:
                    _r = 0, _s = instanceByAgentId.entries();
                    _8.label = 145;
                case 145:
                    if (!(_r < _s.length)) return [3 /*break*/, 148];
                    _t = _s[_r], agentId = _t[0], instance = _t[1];
                    return [4 /*yield*/, ctx.db.insert("changeRecords", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            templateId: instance.templateId,
                            versionId: instance.versionId,
                            instanceId: instance._id,
                            legacyAgentId: agentId,
                            type: "INSTANCE_CREATED",
                            summary: "Instance seeded for ".concat(instance.name),
                            relatedTable: "agentInstances",
                            relatedId: instance._id,
                            timestamp: now - 10 * DAY,
                            metadata: withSeedMeta("change:instance:".concat(instance._id)),
                        })];
                case 146:
                    changeId = _8.sent();
                    changeRecordIds.push(changeId);
                    _8.label = 147;
                case 147:
                    _r++;
                    return [3 /*break*/, 145];
                case 148: return [4 /*yield*/, ctx.db
                        .query("deployments")
                        .withIndex("by_tenant", function (q) { return q.eq("tenantId", tenant._id); })
                        .collect()];
                case 149:
                    deploymentRows = _8.sent();
                    _u = 0, deploymentRows_1 = deploymentRows;
                    _8.label = 150;
                case 150:
                    if (!(_u < deploymentRows_1.length)) return [3 /*break*/, 156];
                    dep = deploymentRows_1[_u];
                    return [4 /*yield*/, ctx.db.insert("changeRecords", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            templateId: dep.templateId,
                            versionId: dep.targetVersionId,
                            type: "DEPLOYMENT_CREATED",
                            summary: "Deployment created (".concat(dep.status, ")"),
                            relatedTable: "deployments",
                            relatedId: dep._id,
                            timestamp: dep.createdAt,
                            metadata: withSeedMeta("change:deployment:create:".concat(dep._id)),
                        })];
                case 151:
                    createdId = _8.sent();
                    changeRecordIds.push(createdId);
                    if (!(dep.status === "ACTIVE")) return [3 /*break*/, 153];
                    return [4 /*yield*/, ctx.db.insert("changeRecords", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            templateId: dep.templateId,
                            versionId: dep.targetVersionId,
                            type: "DEPLOYMENT_ACTIVATED",
                            summary: "Deployment activated",
                            relatedTable: "deployments",
                            relatedId: dep._id,
                            timestamp: (_6 = dep.activatedAt) !== null && _6 !== void 0 ? _6 : dep.createdAt + HOUR,
                            metadata: withSeedMeta("change:deployment:active:".concat(dep._id)),
                        })];
                case 152:
                    activeId = _8.sent();
                    changeRecordIds.push(activeId);
                    _8.label = 153;
                case 153:
                    if (!(dep.status === "ROLLING_BACK")) return [3 /*break*/, 155];
                    return [4 /*yield*/, ctx.db.insert("changeRecords", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            templateId: dep.templateId,
                            versionId: (_7 = dep.previousVersionId) !== null && _7 !== void 0 ? _7 : dep.targetVersionId,
                            type: "DEPLOYMENT_ROLLED_BACK",
                            summary: "Deployment rollback initiated",
                            relatedTable: "deployments",
                            relatedId: dep._id,
                            timestamp: dep.createdAt + 2 * HOUR,
                            metadata: withSeedMeta("change:deployment:rollback:".concat(dep._id)),
                        })];
                case 154:
                    rollbackId = _8.sent();
                    changeRecordIds.push(rollbackId);
                    _8.label = 155;
                case 155:
                    _u++;
                    return [3 /*break*/, 150];
                case 156:
                    opEventTypes = [
                        "RUN_STARTED",
                        "RUN_COMPLETED",
                        "RUN_FAILED",
                        "TOOL_CALL_STARTED",
                        "TOOL_CALL_COMPLETED",
                        "TOOL_CALL_BLOCKED",
                        "HEARTBEAT",
                        "COST_TICK",
                        "MESSAGE_SENT",
                        "DECISION_MADE",
                    ];
                    i = 0;
                    _8.label = 157;
                case 157:
                    if (!(i < 420)) return [3 /*break*/, 161];
                    runId = pick(runIds, i);
                    return [4 /*yield*/, ctx.db.get(runId)];
                case 158:
                    run_2 = _8.sent();
                    if (!run_2)
                        return [3 /*break*/, 160];
                    toolCallId = pick(toolCallIds, i);
                    taskId = pick(insertedTaskIds, i);
                    eventType = i < runIds.length
                        ? "RUN_STARTED"
                        : i < runIds.length * 2
                            ? (run_2.status === "FAILED" ? "RUN_FAILED" : "RUN_COMPLETED")
                            : pick(__spreadArray([], opEventTypes, true), i);
                    return [4 /*yield*/, ctx.db.insert("opEvents", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            type: eventType,
                            timestamp: now - (420 - i) * 3 * 60 * 1000,
                            instanceId: run_2.instanceId,
                            versionId: run_2.versionId,
                            taskId: taskId,
                            runId: run_2._id,
                            toolCallId: i % 2 === 0 ? toolCallId : undefined,
                            changeRecordId: i % 6 === 0 ? pick(changeRecordIds, i) : undefined,
                            payload: {
                                index: i + 1,
                                status: run_2.status,
                                costUsd: run_2.costUsd,
                                source: "seedMissionControlDemo",
                            },
                        })];
                case 159:
                    _8.sent();
                    _8.label = 160;
                case 160:
                    i++;
                    return [3 /*break*/, 157];
                case 161: return [4 /*yield*/, ctx.db
                        .query("operatorControls")
                        .withIndex("by_project", function (q) { return q.eq("projectId", project._id); })
                        .first()];
                case 162:
                    existingControl = _8.sent();
                    if (!!existingControl) return [3 /*break*/, 164];
                    return [4 /*yield*/, ctx.db.insert("operatorControls", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            mode: "NORMAL",
                            reason: "Seeded default mode",
                            updatedBy: "seedMissionControlDemo",
                            updatedAt: now,
                            metadata: withSeedMeta("operator-control:default"),
                        })];
                case 163:
                    _8.sent();
                    _8.label = 164;
                case 164: return [4 /*yield*/, ctx.db.insert("qcRulesets", {
                        tenantId: tenant._id,
                        projectId: project._id,
                        name: "Pre-Release",
                        description: "Full scan with strict gates for production releases",
                        preset: "PRE_RELEASE",
                        requiredDocs: ["README.md", "docs/PRD*.md", "CHANGELOG.md"],
                        coverageThresholds: { unit: 80, integration: 70, e2e: 60 },
                        securityPaths: ["auth/**", "security/**", "api/**"],
                        gateDefinitions: [
                            { name: "PRD exists", condition: "requiredDocs", severity: "RED" },
                            { name: "Coverage meets threshold", condition: "coverageThresholds", severity: "RED" },
                            { name: "Security paths covered", condition: "securityPaths", severity: "RED" },
                            { name: "No RED findings", condition: "findings.red === 0", severity: "RED" },
                        ],
                        active: true,
                        isBuiltIn: false,
                        metadata: withSeedMeta("qc-ruleset:pre-release"),
                    })];
                case 165:
                    preReleaseRuleset = _8.sent();
                    return [4 /*yield*/, ctx.db.insert("qcRulesets", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            name: "Post-Merge",
                            description: "Delta scan focused on changed files only",
                            preset: "POST_MERGE",
                            requiredDocs: ["README.md"],
                            coverageThresholds: { unit: 60, integration: 40, e2e: 20 },
                            securityPaths: ["auth/**", "security/**"],
                            gateDefinitions: [
                                { name: "Changed files have tests", condition: "coverageThresholds", severity: "YELLOW" },
                                { name: "Docs updated if needed", condition: "docsDrift", severity: "YELLOW" },
                            ],
                            active: true,
                            isBuiltIn: false,
                            metadata: withSeedMeta("qc-ruleset:post-merge"),
                        })];
                case 166:
                    postMergeRuleset = _8.sent();
                    qcRunIds = [];
                    qcRunStatuses = ["COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "RUNNING", "PENDING", "FAILED"];
                    qcRiskGrades = ["GREEN", "GREEN", "YELLOW", "RED", undefined, undefined, undefined];
                    qcQualityScores = [92, 88, 75, 62, undefined, undefined, undefined];
                    i = 0;
                    _8.label = 167;
                case 167:
                    if (!(i < 7)) return [3 /*break*/, 186];
                    runSequence = i + 1;
                    runId = "QC-".concat(Math.random().toString(36).substring(2, 8).toUpperCase());
                    status_5 = qcRunStatuses[i];
                    riskGrade = qcRiskGrades[i];
                    qualityScore = qcQualityScores[i];
                    startedAt = now - (7 - i) * 2 * DAY;
                    completedAt = status_5 === "COMPLETED" || status_5 === "FAILED" ? startedAt + 15 * 60 * 1000 : undefined;
                    durationMs = completedAt ? completedAt - startedAt : undefined;
                    findingCounts = status_5 === "COMPLETED" ? {
                        red: i === 3 ? 2 : 0,
                        yellow: i === 2 ? 3 : i === 3 ? 1 : 0,
                        green: i < 2 ? 5 : 2,
                        info: 3,
                    } : undefined;
                    return [4 /*yield*/, ctx.db.insert("qcRuns", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            runId: runId,
                            runSequence: runSequence,
                            status: status_5,
                            riskGrade: riskGrade,
                            qualityScore: qualityScore,
                            repoUrl: "https://github.com/mission-control/mission-control",
                            commitSha: "abc".concat(i, "def").concat(i, "123").concat(i, "456").concat(i),
                            branch: i % 2 === 0 ? "main" : "feat/quality-control",
                            scopeType: i % 3 === 0 ? "FULL_REPO" : i % 3 === 1 ? "BRANCH_DIFF" : "DIRECTORY",
                            scopeSpec: i % 3 === 2 ? { path: "packages/workflow-engine" } : undefined,
                            rulesetId: i % 2 === 0 ? preReleaseRuleset : postMergeRuleset,
                            initiatorType: i % 4 === 0 ? "WORKFLOW" : i % 4 === 1 ? "HUMAN" : i % 4 === 2 ? "AGENT" : "SYSTEM",
                            initiatorId: i % 4 === 2 ? pick(allAgents, i)._id : undefined,
                            findingCounts: findingCounts,
                            gatePassed: status_5 === "COMPLETED" ? riskGrade !== "RED" : undefined,
                            evidenceHash: status_5 === "COMPLETED" ? "sha256:".concat(Math.random().toString(36).substring(2)) : undefined,
                            startedAt: startedAt,
                            completedAt: completedAt,
                            durationMs: durationMs,
                            idempotencyKey: "seed-qc-run-".concat(i),
                            metadata: withSeedMeta("qc-run:".concat(runId)),
                        })];
                case 168:
                    qcRunId = _8.sent();
                    qcRunIds.push(qcRunId);
                    if (!(status_5 === "COMPLETED" && findingCounts)) return [3 /*break*/, 174];
                    severities = ["RED", "YELLOW", "GREEN", "INFO"];
                    categories = ["REQUIREMENT_GAP", "DOCS_DRIFT", "COVERAGE_GAP", "SECURITY_GAP", "CONFIG_MISSING", "DELIVERY_GATE"];
                    findingIdx = 0;
                    _v = 0, severities_1 = severities;
                    _8.label = 169;
                case 169:
                    if (!(_v < severities_1.length)) return [3 /*break*/, 174];
                    severity = severities_1[_v];
                    count = findingCounts[severity.toLowerCase()];
                    j = 0;
                    _8.label = 170;
                case 170:
                    if (!(j < count)) return [3 /*break*/, 173];
                    return [4 /*yield*/, ctx.db.insert("qcFindings", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            qcRunId: qcRunId,
                            severity: severity,
                            category: pick(categories, findingIdx),
                            title: "".concat(severity, " Finding ").concat(j + 1, ": ").concat(pick(categories, findingIdx).replace(/_/g, " ").toLowerCase()),
                            description: "Detailed description of ".concat(severity.toLowerCase(), " severity issue found during QC run ").concat(runId),
                            filePaths: ["src/file".concat(findingIdx, ".ts"), "tests/file".concat(findingIdx, ".test.ts")],
                            lineRanges: [{ file: "src/file".concat(findingIdx, ".ts"), start: 10 + findingIdx, end: 20 + findingIdx }],
                            prdRefs: j % 2 === 0 ? ["REQ-".concat(100 + findingIdx)] : undefined,
                            suggestedFix: severity !== "INFO" ? "Suggested fix for ".concat(severity.toLowerCase(), " issue") : undefined,
                            confidence: 0.7 + (findingIdx % 3) * 0.1,
                            metadata: withSeedMeta("qc-finding:".concat(runId, ":").concat(findingIdx)),
                        })];
                case 171:
                    _8.sent();
                    findingIdx++;
                    _8.label = 172;
                case 172:
                    j++;
                    return [3 /*break*/, 170];
                case 173:
                    _v++;
                    return [3 /*break*/, 169];
                case 174:
                    if (!(status_5 === "COMPLETED")) return [3 /*break*/, 177];
                    return [4 /*yield*/, ctx.db.insert("qcArtifacts", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            qcRunId: qcRunId,
                            type: "EVIDENCE_PACK_JSON",
                            name: "".concat(runId, "_evidence_pack.json"),
                            content: JSON.stringify({
                                schemaVersion: "1.0.0",
                                producer: "assurance-agents-stub/0.1.0",
                                runId: runId,
                                repoUrl: "https://github.com/mission-control/mission-control",
                                commitSha: "abc".concat(i, "def").concat(i, "123").concat(i, "456").concat(i),
                                timestamp: new Date(startedAt).toISOString(),
                                riskGrade: riskGrade,
                                qualityScore: qualityScore,
                                summary: "QC Run ".concat(runId, " completed with ").concat(riskGrade, " risk grade and quality score ").concat(qualityScore),
                            }, null, 2),
                            mimeType: "application/json",
                            sizeBytes: 1024,
                            metadata: withSeedMeta("qc-artifact:".concat(runId, ":evidence")),
                        })];
                case 175:
                    _8.sent();
                    return [4 /*yield*/, ctx.db.insert("qcArtifacts", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            qcRunId: qcRunId,
                            type: "SUMMARY_MD",
                            name: "".concat(runId, "_summary.md"),
                            content: "# QC Run ".concat(runId, "\n\n**Status:** ").concat(status_5, "\n**Risk Grade:** ").concat(riskGrade, "\n**Quality Score:** ").concat(qualityScore, "\n\n## Summary\nQuality control run completed successfully."),
                            mimeType: "text/markdown",
                            sizeBytes: 256,
                            metadata: withSeedMeta("qc-artifact:".concat(runId, ":summary")),
                        })];
                case 176:
                    _8.sent();
                    _8.label = 177;
                case 177:
                    if (!(status_5 === "COMPLETED" && riskGrade === "RED")) return [3 /*break*/, 179];
                    return [4 /*yield*/, ctx.db.insert("alerts", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            qcRunId: qcRunId,
                            severity: "CRITICAL",
                            type: "QC_GATE_FAILED",
                            title: "QC Run ".concat(runId, " failed RED gate"),
                            description: "Quality Control run for mission-control failed critical delivery gates. Review findings immediately.",
                            status: "OPEN",
                            metadata: withSeedMeta("alert:qc-red:".concat(runId)),
                        })];
                case 178:
                    _8.sent();
                    _8.label = 179;
                case 179: 
                // Log QC events
                return [4 /*yield*/, ctx.db.insert("opEvents", {
                        tenantId: tenant._id,
                        projectId: project._id,
                        qcRunId: qcRunId,
                        type: "QC_RUN_STARTED",
                        timestamp: startedAt,
                        payload: { runId: runId, repoUrl: "https://github.com/mission-control/mission-control" },
                    })];
                case 180:
                    // Log QC events
                    _8.sent();
                    if (!(status_5 === "COMPLETED" || status_5 === "FAILED")) return [3 /*break*/, 182];
                    return [4 /*yield*/, ctx.db.insert("opEvents", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            qcRunId: qcRunId,
                            type: status_5 === "COMPLETED" ? "QC_RUN_COMPLETED" : "QC_RUN_FAILED",
                            timestamp: completedAt,
                            payload: { runId: runId, riskGrade: riskGrade, qualityScore: qualityScore, durationMs: durationMs },
                        })];
                case 181:
                    _8.sent();
                    _8.label = 182;
                case 182: 
                // Log change record for run creation
                return [4 /*yield*/, ctx.db.insert("changeRecords", {
                        tenantId: tenant._id,
                        projectId: project._id,
                        type: "QC_RUN_CREATED",
                        summary: "QC run ".concat(runId, " created for mission-control"),
                        relatedTable: "qcRuns",
                        relatedId: qcRunId,
                        timestamp: startedAt,
                        payload: { runId: runId, repoUrl: "https://github.com/mission-control/mission-control", scopeType: "FULL_REPO" },
                    })];
                case 183:
                    // Log change record for run creation
                    _8.sent();
                    if (!(status_5 === "COMPLETED" && findingCounts)) return [3 /*break*/, 185];
                    return [4 /*yield*/, ctx.db.insert("changeRecords", {
                            tenantId: tenant._id,
                            projectId: project._id,
                            type: "QC_FINDINGS_RECORDED",
                            summary: "".concat(findingCounts.red + findingCounts.yellow + findingCounts.green + findingCounts.info, " findings recorded for run ").concat(runId),
                            relatedTable: "qcFindings",
                            relatedId: qcRunId,
                            timestamp: completedAt,
                            payload: { runId: runId, findingCounts: findingCounts },
                        })];
                case 184:
                    _8.sent();
                    _8.label = 185;
                case 185:
                    i++;
                    return [3 /*break*/, 167];
                case 186:
                    seedMeta = __assign(__assign({}, (projectMeta !== null && projectMeta !== void 0 ? projectMeta : {})), { missionControlDemoSeedVersion: SEED_VERSION, missionControlDemoSeededAt: now, missionControlDemoSeedTag: SEED_TAG });
                    return [4 /*yield*/, ctx.db.patch(project._id, { metadata: seedMeta })];
                case 187:
                    _8.sent();
                    _z = {
                        message: "Mission Control demo data seeded",
                        skipped: false,
                        tenantId: tenant._id,
                        projectId: project._id
                    };
                    return [4 /*yield*/, collectCounts(ctx, project._id, tenant._id)];
                case 188: return [2 /*return*/, (_z.counts = _8.sent(),
                        _z)];
            }
        });
    }); },
});

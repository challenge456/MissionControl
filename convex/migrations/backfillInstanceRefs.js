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
exports.runTenantBackfill = exports.runBackfill = exports.backfillMessage = exports.backfillToolCall = exports.backfillRun = exports.backfillTask = exports.backfillApprovalTenant = exports.backfillMessageTenant = exports.backfillToolCallTenant = exports.backfillRunTenant = exports.backfillTaskTenant = exports.backfillAgentTenant = exports.backfillProjectTenant = exports.listApprovalsNeedingTenantBackfill = exports.listMessagesNeedingTenantBackfill = exports.listToolCallsNeedingTenantBackfill = exports.listRunsNeedingTenantBackfill = exports.listTasksNeedingTenantBackfill = exports.listAgentsNeedingTenantBackfill = exports.listProjectsNeedingTenantBackfill = exports.guardMigrationHealth = exports.getMigrationHealth = exports.listMessagesNeedingBackfill = exports.listToolCallsNeedingBackfill = exports.listRunsNeedingBackfill = exports.listTasksNeedingBackfill = void 0;
var values_1 = require("convex/values");
var server_1 = require("../_generated/server");
var api_1 = require("../_generated/api");
var agentResolver_1 = require("../lib/agentResolver");
var armCompat_1 = require("../lib/armCompat");
var getActiveTenant_1 = require("../lib/getActiveTenant");
function collectMigrationHealthSnapshot(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, tasks, runs, toolCalls, messages, projects, agents, approvals, missingInstanceRefs, totalRecords, missingTenant, driftTotals;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        ctx.db.query("tasks").collect(),
                        ctx.db.query("runs").collect(),
                        ctx.db.query("toolCalls").collect(),
                        ctx.db.query("messages").collect(),
                        ctx.db.query("projects").collect(),
                        ctx.db.query("agents").collect(),
                        ctx.db.query("approvals").collect(),
                    ])];
                case 1:
                    _a = _b.sent(), tasks = _a[0], runs = _a[1], toolCalls = _a[2], messages = _a[3], projects = _a[4], agents = _a[5], approvals = _a[6];
                    missingInstanceRefs = {
                        tasks: tasks.filter(function (row) { return row.assigneeIds.length > 0 && (!row.assigneeInstanceIds || row.assigneeInstanceIds.length === 0); }).length,
                        runs: runs.filter(function (row) { return row.agentId && (!row.instanceId || !row.versionId || !row.templateId); }).length,
                        toolCalls: toolCalls.filter(function (row) { return row.agentId && (!row.instanceId || !row.versionId); }).length,
                        messages: messages.filter(function (row) { return row.authorAgentId && !row.authorInstanceId; }).length,
                    };
                    totalRecords = {
                        tasks: tasks.length,
                        runs: runs.length,
                        toolCalls: toolCalls.length,
                        messages: messages.length,
                    };
                    missingTenant = {
                        projects: projects.filter(function (row) { return !row.tenantId; }).length,
                        agents: agents.filter(function (row) { return !row.tenantId; }).length,
                        tasks: tasks.filter(function (row) { return !row.tenantId; }).length,
                        runs: runs.filter(function (row) { return !row.tenantId; }).length,
                        toolCalls: toolCalls.filter(function (row) { return !row.tenantId; }).length,
                        messages: messages.filter(function (row) { return !row.tenantId; }).length,
                        approvals: approvals.filter(function (row) { return !row.tenantId; }).length,
                    };
                    driftTotals = {
                        missingInstanceRefs: missingInstanceRefs.tasks +
                            missingInstanceRefs.runs +
                            missingInstanceRefs.toolCalls +
                            missingInstanceRefs.messages,
                        missingTenant: missingTenant.projects +
                            missingTenant.agents +
                            missingTenant.tasks +
                            missingTenant.runs +
                            missingTenant.toolCalls +
                            missingTenant.messages +
                            missingTenant.approvals,
                    };
                    return [2 /*return*/, {
                            armCompatMode: (0, armCompat_1.preferInstanceRefs)() ? "instance" : "legacy",
                            totalRecords: totalRecords,
                            missingInstanceRefs: missingInstanceRefs,
                            missingTenant: missingTenant,
                            driftTotals: driftTotals,
                        }];
            }
        });
    });
}
exports.listTasksNeedingBackfill = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("tasks").collect()];
                case 1:
                    rows = _a.sent();
                    return [2 /*return*/, rows
                            .filter(function (row) { return row.assigneeIds.length > 0 && (!row.assigneeInstanceIds || row.assigneeInstanceIds.length === 0); })
                            .map(function (row) { return row._id; })];
            }
        });
    }); },
});
exports.listRunsNeedingBackfill = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("runs").collect()];
                case 1:
                    rows = _a.sent();
                    return [2 /*return*/, rows
                            .filter(function (row) { return row.agentId && (!row.instanceId || !row.versionId || !row.templateId); })
                            .map(function (row) { return row._id; })];
            }
        });
    }); },
});
exports.listToolCallsNeedingBackfill = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("toolCalls").collect()];
                case 1:
                    rows = _a.sent();
                    return [2 /*return*/, rows
                            .filter(function (row) { return row.agentId && (!row.instanceId || !row.versionId); })
                            .map(function (row) { return row._id; })];
            }
        });
    }); },
});
exports.listMessagesNeedingBackfill = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("messages").collect()];
                case 1:
                    rows = _a.sent();
                    return [2 /*return*/, rows
                            .filter(function (row) { return row.authorAgentId && !row.authorInstanceId; })
                            .map(function (row) { return row._id; })];
            }
        });
    }); },
});
exports.getMigrationHealth = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var snapshot;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, collectMigrationHealthSnapshot(ctx)];
                case 1:
                    snapshot = _a.sent();
                    return [2 /*return*/, snapshot];
            }
        });
    }); },
});
exports.guardMigrationHealth = (0, server_1.internalMutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var snapshot, now, totalDrift, openAlerts, existing, tenantId, description, alertId;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, collectMigrationHealthSnapshot(ctx)];
                case 1:
                    snapshot = _d.sent();
                    now = Date.now();
                    totalDrift = snapshot.driftTotals.missingInstanceRefs + snapshot.driftTotals.missingTenant;
                    return [4 /*yield*/, ctx.db
                            .query("alerts")
                            .withIndex("by_status", function (q) { return q.eq("status", "OPEN"); })
                            .collect()];
                case 2:
                    openAlerts = _d.sent();
                    existing = openAlerts.find(function (row) { return row.type === "MIGRATION_HEALTH_DRIFT"; });
                    if (!(totalDrift === 0)) return [3 /*break*/, 5];
                    if (!existing) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.patch(existing._id, {
                            status: "RESOLVED",
                            resolvedAt: now,
                            resolutionNote: "Migration health drift resolved automatically by scheduled guard.",
                            metadata: __assign(__assign({}, ((_a = existing.metadata) !== null && _a !== void 0 ? _a : {})), { latestSnapshot: snapshot, updatedAt: now }),
                        })];
                case 3:
                    _d.sent();
                    _d.label = 4;
                case 4: return [2 /*return*/, { healthy: true, totalDrift: totalDrift, resolvedAlertId: existing === null || existing === void 0 ? void 0 : existing._id }];
                case 5: return [4 /*yield*/, (0, getActiveTenant_1.resolveActiveTenantId)({ db: ctx.db }, { createDefaultIfMissing: true })];
                case 6:
                    tenantId = _d.sent();
                    description = "ARM migration drift detected. Missing refs: " +
                        "".concat(snapshot.missingInstanceRefs.tasks, "/").concat(snapshot.missingInstanceRefs.runs, "/").concat(snapshot.missingInstanceRefs.toolCalls, "/").concat(snapshot.missingInstanceRefs.messages, ". ") +
                        "Missing tenant IDs: projects=".concat(snapshot.missingTenant.projects, ", agents=").concat(snapshot.missingTenant.agents, ", tasks=").concat(snapshot.missingTenant.tasks, ", runs=").concat(snapshot.missingTenant.runs, ", toolCalls=").concat(snapshot.missingTenant.toolCalls, ", messages=").concat(snapshot.missingTenant.messages, ", approvals=").concat(snapshot.missingTenant.approvals, ".");
                    if (!existing) return [3 /*break*/, 8];
                    return [4 /*yield*/, ctx.db.patch(existing._id, {
                            tenantId: (_b = existing.tenantId) !== null && _b !== void 0 ? _b : tenantId,
                            severity: totalDrift > 25 ? "ERROR" : "WARNING",
                            description: description,
                            metadata: __assign(__assign({}, ((_c = existing.metadata) !== null && _c !== void 0 ? _c : {})), { latestSnapshot: snapshot, updatedAt: now }),
                        })];
                case 7:
                    _d.sent();
                    return [2 /*return*/, { healthy: false, totalDrift: totalDrift, alertId: existing._id, updated: true }];
                case 8: return [4 /*yield*/, ctx.db.insert("alerts", {
                        tenantId: tenantId,
                        severity: totalDrift > 25 ? "ERROR" : "WARNING",
                        type: "MIGRATION_HEALTH_DRIFT",
                        title: "ARM migration health drift detected",
                        description: description,
                        status: "OPEN",
                        metadata: {
                            latestSnapshot: snapshot,
                            createdBy: "migrations.guardMigrationHealth",
                        },
                    })];
                case 9:
                    alertId = _d.sent();
                    return [2 /*return*/, { healthy: false, totalDrift: totalDrift, alertId: alertId, created: true }];
            }
        });
    }); },
});
exports.listProjectsNeedingTenantBackfill = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("projects").collect()];
                case 1:
                    rows = _a.sent();
                    return [2 /*return*/, rows.filter(function (row) { return !row.tenantId; }).map(function (row) { return row._id; })];
            }
        });
    }); },
});
exports.listAgentsNeedingTenantBackfill = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("agents").collect()];
                case 1:
                    rows = _a.sent();
                    return [2 /*return*/, rows.filter(function (row) { return !row.tenantId; }).map(function (row) { return row._id; })];
            }
        });
    }); },
});
exports.listTasksNeedingTenantBackfill = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("tasks").collect()];
                case 1:
                    rows = _a.sent();
                    return [2 /*return*/, rows.filter(function (row) { return !row.tenantId; }).map(function (row) { return row._id; })];
            }
        });
    }); },
});
exports.listRunsNeedingTenantBackfill = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("runs").collect()];
                case 1:
                    rows = _a.sent();
                    return [2 /*return*/, rows.filter(function (row) { return !row.tenantId; }).map(function (row) { return row._id; })];
            }
        });
    }); },
});
exports.listToolCallsNeedingTenantBackfill = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("toolCalls").collect()];
                case 1:
                    rows = _a.sent();
                    return [2 /*return*/, rows.filter(function (row) { return !row.tenantId; }).map(function (row) { return row._id; })];
            }
        });
    }); },
});
exports.listMessagesNeedingTenantBackfill = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("messages").collect()];
                case 1:
                    rows = _a.sent();
                    return [2 /*return*/, rows.filter(function (row) { return !row.tenantId; }).map(function (row) { return row._id; })];
            }
        });
    }); },
});
exports.listApprovalsNeedingTenantBackfill = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("approvals").collect()];
                case 1:
                    rows = _a.sent();
                    return [2 /*return*/, rows.filter(function (row) { return !row.tenantId; }).map(function (row) { return row._id; })];
            }
        });
    }); },
});
exports.backfillProjectTenant = (0, server_1.mutation)({
    args: { projectId: values_1.v.id("projects") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var project, tenantId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.projectId)];
                case 1:
                    project = _a.sent();
                    if (!project || project.tenantId)
                        return [2 /*return*/, { updated: false }];
                    return [4 /*yield*/, (0, getActiveTenant_1.resolveActiveTenantId)({ db: ctx.db }, { createDefaultIfMissing: true })];
                case 2:
                    tenantId = _a.sent();
                    if (!tenantId)
                        return [2 /*return*/, { updated: false }];
                    return [4 /*yield*/, ctx.db.patch(project._id, { tenantId: tenantId })];
                case 3:
                    _a.sent();
                    return [2 /*return*/, { updated: true }];
            }
        });
    }); },
});
exports.backfillAgentTenant = (0, server_1.mutation)({
    args: { agentId: values_1.v.id("agents") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var agent, project, _a, tenantId;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.agentId)];
                case 1:
                    agent = _b.sent();
                    if (!agent || agent.tenantId)
                        return [2 /*return*/, { updated: false }];
                    if (!agent.projectId) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db.get(agent.projectId)];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = null;
                    _b.label = 4;
                case 4:
                    project = _a;
                    return [4 /*yield*/, (0, getActiveTenant_1.resolveActiveTenantId)({ db: ctx.db }, { projectId: project === null || project === void 0 ? void 0 : project._id, createDefaultIfMissing: true })];
                case 5:
                    tenantId = _b.sent();
                    if (!tenantId)
                        return [2 /*return*/, { updated: false }];
                    return [4 /*yield*/, ctx.db.patch(agent._id, { tenantId: tenantId })];
                case 6:
                    _b.sent();
                    return [2 /*return*/, { updated: true }];
            }
        });
    }); },
});
exports.backfillTaskTenant = (0, server_1.mutation)({
    args: { taskId: values_1.v.id("tasks") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var task, primaryAssigneeId, primaryAssignee, _a, tenantId;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1:
                    task = _c.sent();
                    if (!task || task.tenantId)
                        return [2 /*return*/, { updated: false }];
                    primaryAssigneeId = (_b = task.assigneeIds) === null || _b === void 0 ? void 0 : _b[0];
                    if (!primaryAssigneeId) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db.get(primaryAssigneeId)];
                case 2:
                    _a = _c.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = null;
                    _c.label = 4;
                case 4:
                    primaryAssignee = _a;
                    return [4 /*yield*/, (0, getActiveTenant_1.resolveActiveTenantId)({ db: ctx.db }, {
                            projectId: task.projectId,
                            tenantId: primaryAssignee === null || primaryAssignee === void 0 ? void 0 : primaryAssignee.tenantId,
                            createDefaultIfMissing: true,
                        })];
                case 5:
                    tenantId = _c.sent();
                    if (!tenantId)
                        return [2 /*return*/, { updated: false }];
                    return [4 /*yield*/, ctx.db.patch(task._id, { tenantId: tenantId })];
                case 6:
                    _c.sent();
                    return [2 /*return*/, { updated: true }];
            }
        });
    }); },
});
exports.backfillRunTenant = (0, server_1.mutation)({
    args: { runId: values_1.v.id("runs") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var run, agent, task, _a, tenantId;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.runId)];
                case 1:
                    run = _d.sent();
                    if (!run || run.tenantId)
                        return [2 /*return*/, { updated: false }];
                    return [4 /*yield*/, ctx.db.get(run.agentId)];
                case 2:
                    agent = _d.sent();
                    if (!run.taskId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.get(run.taskId)];
                case 3:
                    _a = _d.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = null;
                    _d.label = 5;
                case 5:
                    task = _a;
                    return [4 /*yield*/, (0, getActiveTenant_1.resolveActiveTenantId)({ db: ctx.db }, {
                            projectId: (_b = run.projectId) !== null && _b !== void 0 ? _b : task === null || task === void 0 ? void 0 : task.projectId,
                            tenantId: (_c = agent === null || agent === void 0 ? void 0 : agent.tenantId) !== null && _c !== void 0 ? _c : task === null || task === void 0 ? void 0 : task.tenantId,
                            createDefaultIfMissing: true,
                        })];
                case 6:
                    tenantId = _d.sent();
                    if (!tenantId)
                        return [2 /*return*/, { updated: false }];
                    return [4 /*yield*/, ctx.db.patch(run._id, { tenantId: tenantId })];
                case 7:
                    _d.sent();
                    return [2 /*return*/, { updated: true }];
            }
        });
    }); },
});
exports.backfillToolCallTenant = (0, server_1.mutation)({
    args: { toolCallId: values_1.v.id("toolCalls") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var toolCall, agent, run, task, _a, tenantId;
        var _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.toolCallId)];
                case 1:
                    toolCall = _f.sent();
                    if (!toolCall || toolCall.tenantId)
                        return [2 /*return*/, { updated: false }];
                    return [4 /*yield*/, ctx.db.get(toolCall.agentId)];
                case 2:
                    agent = _f.sent();
                    return [4 /*yield*/, ctx.db.get(toolCall.runId)];
                case 3:
                    run = _f.sent();
                    if (!toolCall.taskId) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.db.get(toolCall.taskId)];
                case 4:
                    _a = _f.sent();
                    return [3 /*break*/, 6];
                case 5:
                    _a = null;
                    _f.label = 6;
                case 6:
                    task = _a;
                    return [4 /*yield*/, (0, getActiveTenant_1.resolveActiveTenantId)({ db: ctx.db }, {
                            projectId: (_c = (_b = toolCall.projectId) !== null && _b !== void 0 ? _b : run === null || run === void 0 ? void 0 : run.projectId) !== null && _c !== void 0 ? _c : task === null || task === void 0 ? void 0 : task.projectId,
                            tenantId: (_e = (_d = agent === null || agent === void 0 ? void 0 : agent.tenantId) !== null && _d !== void 0 ? _d : run === null || run === void 0 ? void 0 : run.tenantId) !== null && _e !== void 0 ? _e : task === null || task === void 0 ? void 0 : task.tenantId,
                            createDefaultIfMissing: true,
                        })];
                case 7:
                    tenantId = _f.sent();
                    if (!tenantId)
                        return [2 /*return*/, { updated: false }];
                    return [4 /*yield*/, ctx.db.patch(toolCall._id, { tenantId: tenantId })];
                case 8:
                    _f.sent();
                    return [2 /*return*/, { updated: true }];
            }
        });
    }); },
});
exports.backfillMessageTenant = (0, server_1.mutation)({
    args: { messageId: values_1.v.id("messages") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var message, task, author, _a, tenantId;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.messageId)];
                case 1:
                    message = _d.sent();
                    if (!message || message.tenantId)
                        return [2 /*return*/, { updated: false }];
                    return [4 /*yield*/, ctx.db.get(message.taskId)];
                case 2:
                    task = _d.sent();
                    if (!message.authorAgentId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.get(message.authorAgentId)];
                case 3:
                    _a = _d.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = null;
                    _d.label = 5;
                case 5:
                    author = _a;
                    return [4 /*yield*/, (0, getActiveTenant_1.resolveActiveTenantId)({ db: ctx.db }, {
                            projectId: (_b = message.projectId) !== null && _b !== void 0 ? _b : task === null || task === void 0 ? void 0 : task.projectId,
                            tenantId: (_c = task === null || task === void 0 ? void 0 : task.tenantId) !== null && _c !== void 0 ? _c : author === null || author === void 0 ? void 0 : author.tenantId,
                            createDefaultIfMissing: true,
                        })];
                case 6:
                    tenantId = _d.sent();
                    if (!tenantId)
                        return [2 /*return*/, { updated: false }];
                    return [4 /*yield*/, ctx.db.patch(message._id, { tenantId: tenantId })];
                case 7:
                    _d.sent();
                    return [2 /*return*/, { updated: true }];
            }
        });
    }); },
});
exports.backfillApprovalTenant = (0, server_1.mutation)({
    args: { approvalId: values_1.v.id("approvals") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var approval, requestor, task, _a, toolCall, _b, run, _c, tenantId;
        var _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.approvalId)];
                case 1:
                    approval = _k.sent();
                    if (!approval || approval.tenantId)
                        return [2 /*return*/, { updated: false }];
                    return [4 /*yield*/, ctx.db.get(approval.requestorAgentId)];
                case 2:
                    requestor = _k.sent();
                    if (!approval.taskId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.get(approval.taskId)];
                case 3:
                    _a = _k.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = null;
                    _k.label = 5;
                case 5:
                    task = _a;
                    if (!approval.toolCallId) return [3 /*break*/, 7];
                    return [4 /*yield*/, ctx.db.get(approval.toolCallId)];
                case 6:
                    _b = _k.sent();
                    return [3 /*break*/, 8];
                case 7:
                    _b = null;
                    _k.label = 8;
                case 8:
                    toolCall = _b;
                    if (!(toolCall === null || toolCall === void 0 ? void 0 : toolCall.runId)) return [3 /*break*/, 10];
                    return [4 /*yield*/, ctx.db.get(toolCall.runId)];
                case 9:
                    _c = _k.sent();
                    return [3 /*break*/, 11];
                case 10:
                    _c = null;
                    _k.label = 11;
                case 11:
                    run = _c;
                    return [4 /*yield*/, (0, getActiveTenant_1.resolveActiveTenantId)({ db: ctx.db }, {
                            projectId: (_f = (_e = (_d = approval.projectId) !== null && _d !== void 0 ? _d : task === null || task === void 0 ? void 0 : task.projectId) !== null && _e !== void 0 ? _e : toolCall === null || toolCall === void 0 ? void 0 : toolCall.projectId) !== null && _f !== void 0 ? _f : run === null || run === void 0 ? void 0 : run.projectId,
                            tenantId: (_j = (_h = (_g = requestor === null || requestor === void 0 ? void 0 : requestor.tenantId) !== null && _g !== void 0 ? _g : task === null || task === void 0 ? void 0 : task.tenantId) !== null && _h !== void 0 ? _h : toolCall === null || toolCall === void 0 ? void 0 : toolCall.tenantId) !== null && _j !== void 0 ? _j : run === null || run === void 0 ? void 0 : run.tenantId,
                            createDefaultIfMissing: true,
                        })];
                case 12:
                    tenantId = _k.sent();
                    if (!tenantId)
                        return [2 /*return*/, { updated: false }];
                    return [4 /*yield*/, ctx.db.patch(approval._id, { tenantId: tenantId })];
                case 13:
                    _k.sent();
                    return [2 /*return*/, { updated: true }];
            }
        });
    }); },
});
exports.backfillTask = (0, server_1.mutation)({
    args: { taskId: values_1.v.id("tasks") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var task, refs, assigneeInstanceIds;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1:
                    task = _a.sent();
                    if (!task)
                        return [2 /*return*/, { updated: false }];
                    if (!task.assigneeIds.length)
                        return [2 /*return*/, { updated: false }];
                    return [4 /*yield*/, Promise.all(task.assigneeIds.map(function (agentId) {
                            return (0, agentResolver_1.resolveAgentRef)({ db: ctx.db }, { agentId: agentId, createIfMissing: true });
                        }))];
                case 2:
                    refs = _a.sent();
                    assigneeInstanceIds = refs
                        .filter(function (row) { return row !== null; })
                        .map(function (row) { return row.instanceId; });
                    return [4 /*yield*/, ctx.db.patch(task._id, { assigneeInstanceIds: assigneeInstanceIds })];
                case 3:
                    _a.sent();
                    return [2 /*return*/, { updated: true }];
            }
        });
    }); },
});
exports.backfillRun = (0, server_1.mutation)({
    args: { runId: values_1.v.id("runs") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var run, ref;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.runId)];
                case 1:
                    run = _a.sent();
                    if (!run)
                        return [2 /*return*/, { updated: false }];
                    return [4 /*yield*/, (0, agentResolver_1.resolveAgentRef)({ db: ctx.db }, { agentId: run.agentId, createIfMissing: true })];
                case 2:
                    ref = _a.sent();
                    if (!ref)
                        return [2 /*return*/, { updated: false }];
                    return [4 /*yield*/, ctx.db.patch(run._id, {
                            instanceId: ref.instanceId,
                            versionId: ref.versionId,
                            templateId: ref.templateId,
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/, { updated: true }];
            }
        });
    }); },
});
exports.backfillToolCall = (0, server_1.mutation)({
    args: { toolCallId: values_1.v.id("toolCalls") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var toolCall, ref;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.toolCallId)];
                case 1:
                    toolCall = _a.sent();
                    if (!toolCall || !toolCall.agentId)
                        return [2 /*return*/, { updated: false }];
                    return [4 /*yield*/, (0, agentResolver_1.resolveAgentRef)({ db: ctx.db }, { agentId: toolCall.agentId, createIfMissing: true })];
                case 2:
                    ref = _a.sent();
                    if (!ref)
                        return [2 /*return*/, { updated: false }];
                    return [4 /*yield*/, ctx.db.patch(toolCall._id, {
                            instanceId: ref.instanceId,
                            versionId: ref.versionId,
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/, { updated: true }];
            }
        });
    }); },
});
exports.backfillMessage = (0, server_1.mutation)({
    args: { messageId: values_1.v.id("messages") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var message, ref;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.messageId)];
                case 1:
                    message = _a.sent();
                    if (!message || !message.authorAgentId)
                        return [2 /*return*/, { updated: false }];
                    return [4 /*yield*/, (0, agentResolver_1.resolveAgentRef)({ db: ctx.db }, { agentId: message.authorAgentId, createIfMissing: true })];
                case 2:
                    ref = _a.sent();
                    if (!ref)
                        return [2 /*return*/, { updated: false }];
                    return [4 /*yield*/, ctx.db.patch(message._id, {
                            authorInstanceId: ref.instanceId,
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/, { updated: true }];
            }
        });
    }); },
});
exports.runBackfill = (0, server_1.action)({
    args: {
        tasksOffset: values_1.v.optional(values_1.v.number()),
        runsOffset: values_1.v.optional(values_1.v.number()),
        toolCallsOffset: values_1.v.optional(values_1.v.number()),
        messagesOffset: values_1.v.optional(values_1.v.number()),
        batchSize: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var anyApi, batchSize, _a, taskIds, runIds, toolCallIds, messageIds, tasksOffset, runsOffset, toolCallsOffset, messagesOffset, tasksUpdated, runsUpdated, toolCallsUpdated, messagesUpdated, _i, _b, taskId, result, _c, _d, runId, result, _e, _f, toolCallId, result, _g, _h, messageId, result, next, done;
        var _j, _k, _l, _m, _o;
        return __generator(this, function (_p) {
            switch (_p.label) {
                case 0:
                    anyApi = api_1.api;
                    batchSize = (_j = args.batchSize) !== null && _j !== void 0 ? _j : 100;
                    return [4 /*yield*/, Promise.all([
                            ctx.runQuery(anyApi.migrations.backfillInstanceRefs.listTasksNeedingBackfill, {}),
                            ctx.runQuery(anyApi.migrations.backfillInstanceRefs.listRunsNeedingBackfill, {}),
                            ctx.runQuery(anyApi.migrations.backfillInstanceRefs.listToolCallsNeedingBackfill, {}),
                            ctx.runQuery(anyApi.migrations.backfillInstanceRefs.listMessagesNeedingBackfill, {}),
                        ])];
                case 1:
                    _a = _p.sent(), taskIds = _a[0], runIds = _a[1], toolCallIds = _a[2], messageIds = _a[3];
                    tasksOffset = (_k = args.tasksOffset) !== null && _k !== void 0 ? _k : 0;
                    runsOffset = (_l = args.runsOffset) !== null && _l !== void 0 ? _l : 0;
                    toolCallsOffset = (_m = args.toolCallsOffset) !== null && _m !== void 0 ? _m : 0;
                    messagesOffset = (_o = args.messagesOffset) !== null && _o !== void 0 ? _o : 0;
                    tasksUpdated = 0;
                    runsUpdated = 0;
                    toolCallsUpdated = 0;
                    messagesUpdated = 0;
                    _i = 0, _b = taskIds.slice(tasksOffset, tasksOffset + batchSize);
                    _p.label = 2;
                case 2:
                    if (!(_i < _b.length)) return [3 /*break*/, 5];
                    taskId = _b[_i];
                    return [4 /*yield*/, ctx.runMutation(anyApi.migrations.backfillInstanceRefs.backfillTask, { taskId: taskId })];
                case 3:
                    result = _p.sent();
                    if (result.updated)
                        tasksUpdated++;
                    _p.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    _c = 0, _d = runIds.slice(runsOffset, runsOffset + batchSize);
                    _p.label = 6;
                case 6:
                    if (!(_c < _d.length)) return [3 /*break*/, 9];
                    runId = _d[_c];
                    return [4 /*yield*/, ctx.runMutation(anyApi.migrations.backfillInstanceRefs.backfillRun, { runId: runId })];
                case 7:
                    result = _p.sent();
                    if (result.updated)
                        runsUpdated++;
                    _p.label = 8;
                case 8:
                    _c++;
                    return [3 /*break*/, 6];
                case 9:
                    _e = 0, _f = toolCallIds.slice(toolCallsOffset, toolCallsOffset + batchSize);
                    _p.label = 10;
                case 10:
                    if (!(_e < _f.length)) return [3 /*break*/, 13];
                    toolCallId = _f[_e];
                    return [4 /*yield*/, ctx.runMutation(anyApi.migrations.backfillInstanceRefs.backfillToolCall, { toolCallId: toolCallId })];
                case 11:
                    result = _p.sent();
                    if (result.updated)
                        toolCallsUpdated++;
                    _p.label = 12;
                case 12:
                    _e++;
                    return [3 /*break*/, 10];
                case 13:
                    _g = 0, _h = messageIds.slice(messagesOffset, messagesOffset + batchSize);
                    _p.label = 14;
                case 14:
                    if (!(_g < _h.length)) return [3 /*break*/, 17];
                    messageId = _h[_g];
                    return [4 /*yield*/, ctx.runMutation(anyApi.migrations.backfillInstanceRefs.backfillMessage, { messageId: messageId })];
                case 15:
                    result = _p.sent();
                    if (result.updated)
                        messagesUpdated++;
                    _p.label = 16;
                case 16:
                    _g++;
                    return [3 /*break*/, 14];
                case 17:
                    next = {
                        tasksOffset: tasksOffset + Math.min(batchSize, Math.max(taskIds.length - tasksOffset, 0)),
                        runsOffset: runsOffset + Math.min(batchSize, Math.max(runIds.length - runsOffset, 0)),
                        toolCallsOffset: toolCallsOffset + Math.min(batchSize, Math.max(toolCallIds.length - toolCallsOffset, 0)),
                        messagesOffset: messagesOffset + Math.min(batchSize, Math.max(messageIds.length - messagesOffset, 0)),
                    };
                    done = next.tasksOffset >= taskIds.length &&
                        next.runsOffset >= runIds.length &&
                        next.toolCallsOffset >= toolCallIds.length &&
                        next.messagesOffset >= messageIds.length;
                    return [2 /*return*/, {
                            done: done,
                            batchSize: batchSize,
                            totals: {
                                tasks: taskIds.length,
                                runs: runIds.length,
                                toolCalls: toolCallIds.length,
                                messages: messageIds.length,
                            },
                            updated: {
                                tasks: tasksUpdated,
                                runs: runsUpdated,
                                toolCalls: toolCallsUpdated,
                                messages: messagesUpdated,
                            },
                            next: next,
                        }];
            }
        });
    }); },
});
exports.runTenantBackfill = (0, server_1.action)({
    args: {
        projectsOffset: values_1.v.optional(values_1.v.number()),
        agentsOffset: values_1.v.optional(values_1.v.number()),
        tasksOffset: values_1.v.optional(values_1.v.number()),
        runsOffset: values_1.v.optional(values_1.v.number()),
        toolCallsOffset: values_1.v.optional(values_1.v.number()),
        messagesOffset: values_1.v.optional(values_1.v.number()),
        approvalsOffset: values_1.v.optional(values_1.v.number()),
        batchSize: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var anyApi, batchSize, _a, projectIds, agentIds, taskIds, runIds, toolCallIds, messageIds, approvalIds, projectsOffset, agentsOffset, tasksOffset, runsOffset, toolCallsOffset, messagesOffset, approvalsOffset, projectsUpdated, agentsUpdated, tasksUpdated, runsUpdated, toolCallsUpdated, messagesUpdated, approvalsUpdated, _i, _b, projectId, result, _c, _d, agentId, result, _e, _f, taskId, result, _g, _h, runId, result, _j, _k, toolCallId, result, _l, _m, messageId, result, _o, _p, approvalId, result, next, done;
        var _q, _r, _s, _t, _u, _v, _w, _x;
        return __generator(this, function (_y) {
            switch (_y.label) {
                case 0:
                    anyApi = api_1.api;
                    batchSize = (_q = args.batchSize) !== null && _q !== void 0 ? _q : 100;
                    return [4 /*yield*/, Promise.all([
                            ctx.runQuery(anyApi.migrations.backfillInstanceRefs.listProjectsNeedingTenantBackfill, {}),
                            ctx.runQuery(anyApi.migrations.backfillInstanceRefs.listAgentsNeedingTenantBackfill, {}),
                            ctx.runQuery(anyApi.migrations.backfillInstanceRefs.listTasksNeedingTenantBackfill, {}),
                            ctx.runQuery(anyApi.migrations.backfillInstanceRefs.listRunsNeedingTenantBackfill, {}),
                            ctx.runQuery(anyApi.migrations.backfillInstanceRefs.listToolCallsNeedingTenantBackfill, {}),
                            ctx.runQuery(anyApi.migrations.backfillInstanceRefs.listMessagesNeedingTenantBackfill, {}),
                            ctx.runQuery(anyApi.migrations.backfillInstanceRefs.listApprovalsNeedingTenantBackfill, {}),
                        ])];
                case 1:
                    _a = _y.sent(), projectIds = _a[0], agentIds = _a[1], taskIds = _a[2], runIds = _a[3], toolCallIds = _a[4], messageIds = _a[5], approvalIds = _a[6];
                    projectsOffset = (_r = args.projectsOffset) !== null && _r !== void 0 ? _r : 0;
                    agentsOffset = (_s = args.agentsOffset) !== null && _s !== void 0 ? _s : 0;
                    tasksOffset = (_t = args.tasksOffset) !== null && _t !== void 0 ? _t : 0;
                    runsOffset = (_u = args.runsOffset) !== null && _u !== void 0 ? _u : 0;
                    toolCallsOffset = (_v = args.toolCallsOffset) !== null && _v !== void 0 ? _v : 0;
                    messagesOffset = (_w = args.messagesOffset) !== null && _w !== void 0 ? _w : 0;
                    approvalsOffset = (_x = args.approvalsOffset) !== null && _x !== void 0 ? _x : 0;
                    projectsUpdated = 0;
                    agentsUpdated = 0;
                    tasksUpdated = 0;
                    runsUpdated = 0;
                    toolCallsUpdated = 0;
                    messagesUpdated = 0;
                    approvalsUpdated = 0;
                    _i = 0, _b = projectIds.slice(projectsOffset, projectsOffset + batchSize);
                    _y.label = 2;
                case 2:
                    if (!(_i < _b.length)) return [3 /*break*/, 5];
                    projectId = _b[_i];
                    return [4 /*yield*/, ctx.runMutation(anyApi.migrations.backfillInstanceRefs.backfillProjectTenant, { projectId: projectId })];
                case 3:
                    result = _y.sent();
                    if (result.updated)
                        projectsUpdated++;
                    _y.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    _c = 0, _d = agentIds.slice(agentsOffset, agentsOffset + batchSize);
                    _y.label = 6;
                case 6:
                    if (!(_c < _d.length)) return [3 /*break*/, 9];
                    agentId = _d[_c];
                    return [4 /*yield*/, ctx.runMutation(anyApi.migrations.backfillInstanceRefs.backfillAgentTenant, { agentId: agentId })];
                case 7:
                    result = _y.sent();
                    if (result.updated)
                        agentsUpdated++;
                    _y.label = 8;
                case 8:
                    _c++;
                    return [3 /*break*/, 6];
                case 9:
                    _e = 0, _f = taskIds.slice(tasksOffset, tasksOffset + batchSize);
                    _y.label = 10;
                case 10:
                    if (!(_e < _f.length)) return [3 /*break*/, 13];
                    taskId = _f[_e];
                    return [4 /*yield*/, ctx.runMutation(anyApi.migrations.backfillInstanceRefs.backfillTaskTenant, { taskId: taskId })];
                case 11:
                    result = _y.sent();
                    if (result.updated)
                        tasksUpdated++;
                    _y.label = 12;
                case 12:
                    _e++;
                    return [3 /*break*/, 10];
                case 13:
                    _g = 0, _h = runIds.slice(runsOffset, runsOffset + batchSize);
                    _y.label = 14;
                case 14:
                    if (!(_g < _h.length)) return [3 /*break*/, 17];
                    runId = _h[_g];
                    return [4 /*yield*/, ctx.runMutation(anyApi.migrations.backfillInstanceRefs.backfillRunTenant, { runId: runId })];
                case 15:
                    result = _y.sent();
                    if (result.updated)
                        runsUpdated++;
                    _y.label = 16;
                case 16:
                    _g++;
                    return [3 /*break*/, 14];
                case 17:
                    _j = 0, _k = toolCallIds.slice(toolCallsOffset, toolCallsOffset + batchSize);
                    _y.label = 18;
                case 18:
                    if (!(_j < _k.length)) return [3 /*break*/, 21];
                    toolCallId = _k[_j];
                    return [4 /*yield*/, ctx.runMutation(anyApi.migrations.backfillInstanceRefs.backfillToolCallTenant, { toolCallId: toolCallId })];
                case 19:
                    result = _y.sent();
                    if (result.updated)
                        toolCallsUpdated++;
                    _y.label = 20;
                case 20:
                    _j++;
                    return [3 /*break*/, 18];
                case 21:
                    _l = 0, _m = messageIds.slice(messagesOffset, messagesOffset + batchSize);
                    _y.label = 22;
                case 22:
                    if (!(_l < _m.length)) return [3 /*break*/, 25];
                    messageId = _m[_l];
                    return [4 /*yield*/, ctx.runMutation(anyApi.migrations.backfillInstanceRefs.backfillMessageTenant, { messageId: messageId })];
                case 23:
                    result = _y.sent();
                    if (result.updated)
                        messagesUpdated++;
                    _y.label = 24;
                case 24:
                    _l++;
                    return [3 /*break*/, 22];
                case 25:
                    _o = 0, _p = approvalIds.slice(approvalsOffset, approvalsOffset + batchSize);
                    _y.label = 26;
                case 26:
                    if (!(_o < _p.length)) return [3 /*break*/, 29];
                    approvalId = _p[_o];
                    return [4 /*yield*/, ctx.runMutation(anyApi.migrations.backfillInstanceRefs.backfillApprovalTenant, { approvalId: approvalId })];
                case 27:
                    result = _y.sent();
                    if (result.updated)
                        approvalsUpdated++;
                    _y.label = 28;
                case 28:
                    _o++;
                    return [3 /*break*/, 26];
                case 29:
                    next = {
                        projectsOffset: projectsOffset + Math.min(batchSize, Math.max(projectIds.length - projectsOffset, 0)),
                        agentsOffset: agentsOffset + Math.min(batchSize, Math.max(agentIds.length - agentsOffset, 0)),
                        tasksOffset: tasksOffset + Math.min(batchSize, Math.max(taskIds.length - tasksOffset, 0)),
                        runsOffset: runsOffset + Math.min(batchSize, Math.max(runIds.length - runsOffset, 0)),
                        toolCallsOffset: toolCallsOffset + Math.min(batchSize, Math.max(toolCallIds.length - toolCallsOffset, 0)),
                        messagesOffset: messagesOffset + Math.min(batchSize, Math.max(messageIds.length - messagesOffset, 0)),
                        approvalsOffset: approvalsOffset + Math.min(batchSize, Math.max(approvalIds.length - approvalsOffset, 0)),
                    };
                    done = next.projectsOffset >= projectIds.length &&
                        next.agentsOffset >= agentIds.length &&
                        next.tasksOffset >= taskIds.length &&
                        next.runsOffset >= runIds.length &&
                        next.toolCallsOffset >= toolCallIds.length &&
                        next.messagesOffset >= messageIds.length &&
                        next.approvalsOffset >= approvalIds.length;
                    return [2 /*return*/, {
                            done: done,
                            batchSize: batchSize,
                            totals: {
                                projects: projectIds.length,
                                agents: agentIds.length,
                                tasks: taskIds.length,
                                runs: runIds.length,
                                toolCalls: toolCallIds.length,
                                messages: messageIds.length,
                                approvals: approvalIds.length,
                            },
                            updated: {
                                projects: projectsUpdated,
                                agents: agentsUpdated,
                                tasks: tasksUpdated,
                                runs: runsUpdated,
                                toolCalls: toolCallsUpdated,
                                messages: messagesUpdated,
                                approvals: approvalsUpdated,
                            },
                            next: next,
                        }];
            }
        });
    }); },
});

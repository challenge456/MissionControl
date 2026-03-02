"use strict";
/**
 * QC Runs — Convex Functions
 *
 * Quality Control run lifecycle and execution.
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
exports.transitionToRunning = exports.execute = exports.complete = exports.cancel = exports.start = exports.diff = exports.environmentSummary = exports.listByEnvironment = exports.projectScores = exports.getByRunId = exports.get = exports.list = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var api_1 = require("./_generated/api");
var armAudit_1 = require("./lib/armAudit");
// ============================================================================
// HELPERS
// ============================================================================
function generateRunId() {
    return "QC-".concat(Math.random().toString(36).substring(2, 8).toUpperCase());
}
function computeEvidenceHash(evidencePack) {
    return __awaiter(this, void 0, void 0, function () {
        var json, encoder, data, hashBuffer, hashArray;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    json = JSON.stringify(evidencePack);
                    encoder = new TextEncoder();
                    data = encoder.encode(json);
                    return [4 /*yield*/, crypto.subtle.digest("SHA-256", data)];
                case 1:
                    hashBuffer = _a.sent();
                    hashArray = Array.from(new Uint8Array(hashBuffer));
                    return [2 /*return*/, hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('')];
            }
        });
    });
}
function computeRiskGrade(gates) {
    // Deterministic: any RED gate fail -> RED, any YELLOW gate fail -> YELLOW, else GREEN
    var hasRedFail = gates.some(function (g) { return g.severity === "RED" && !g.passed; });
    if (hasRedFail)
        return "RED";
    var hasYellowFail = gates.some(function (g) { return g.severity === "YELLOW" && !g.passed; });
    if (hasYellowFail)
        return "YELLOW";
    return "GREEN";
}
// ============================================================================
// QUERIES
// ============================================================================
/**
 * List QC runs
 */
exports.list = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        status: values_1.v.optional(values_1.v.string()),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (!(args.projectId && args.status)) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("qcRuns")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .filter(function (q) { return q.eq(q.field("status"), args.status); })
                            .order("desc")
                            .take((_a = args.limit) !== null && _a !== void 0 ? _a : 50)];
                case 1: return [2 /*return*/, _e.sent()];
                case 2:
                    if (!args.projectId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db
                            .query("qcRuns")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .order("desc")
                            .take((_b = args.limit) !== null && _b !== void 0 ? _b : 50)];
                case 3: return [2 /*return*/, _e.sent()];
                case 4:
                    if (!args.status) return [3 /*break*/, 6];
                    return [4 /*yield*/, ctx.db
                            .query("qcRuns")
                            .withIndex("by_status", function (q) { return q.eq("status", args.status); })
                            .order("desc")
                            .take((_c = args.limit) !== null && _c !== void 0 ? _c : 50)];
                case 5: return [2 /*return*/, _e.sent()];
                case 6: return [4 /*yield*/, ctx.db
                        .query("qcRuns")
                        .order("desc")
                        .take((_d = args.limit) !== null && _d !== void 0 ? _d : 50)];
                case 7: return [2 /*return*/, _e.sent()];
            }
        });
    }); },
});
/**
 * Get a single QC run
 */
exports.get = (0, server_1.query)({
    args: { id: values_1.v.id("qcRuns") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.id)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/**
 * Get QC run by runId
 */
exports.getByRunId = (0, server_1.query)({
    args: { runId: values_1.v.string() },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("qcRuns")
                        .filter(function (q) { return q.eq(q.field("runId"), args.runId); })
                        .first()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/**
 * Get quality score history for sparklines
 */
exports.projectScores = (0, server_1.query)({
    args: {
        projectId: values_1.v.id("projects"),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var runs;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("qcRuns")
                        .withIndex("by_project_sequence", function (q) { return q.eq("projectId", args.projectId); })
                        .order("desc")
                        .take((_a = args.limit) !== null && _a !== void 0 ? _a : 10)];
                case 1:
                    runs = _b.sent();
                    return [2 /*return*/, runs
                            .filter(function (r) { return r.qualityScore !== undefined; })
                            .map(function (r) { return ({
                            runId: r.runId,
                            runSequence: r.runSequence,
                            qualityScore: r.qualityScore,
                            riskGrade: r.riskGrade,
                            completedAt: r.completedAt,
                        }); })];
            }
        });
    }); },
});
/**
 * List QC runs filtered by environment
 */
exports.listByEnvironment = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        environment: values_1.v.optional(values_1.v.union(values_1.v.literal("local"), values_1.v.literal("dev"), values_1.v.literal("staging"), values_1.v.literal("pilot"), values_1.v.literal("production"))),
        status: values_1.v.optional(values_1.v.string()),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit, runs, runs, runs;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 50;
                    if (!(args.projectId && args.environment)) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("qcRuns")
                            .withIndex("by_project_env", function (q) {
                            return q.eq("projectId", args.projectId).eq("environment", args.environment);
                        })
                            .order("desc")
                            .take(limit)];
                case 1:
                    runs = _b.sent();
                    if (args.status)
                        return [2 /*return*/, runs.filter(function (r) { return r.status === args.status; })];
                    return [2 /*return*/, runs];
                case 2:
                    if (!args.projectId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db
                            .query("qcRuns")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .order("desc")
                            .take(limit * 2)];
                case 3:
                    runs = _b.sent();
                    if (args.environment)
                        runs = runs.filter(function (r) { return r.environment === args.environment; });
                    if (args.status)
                        runs = runs.filter(function (r) { return r.status === args.status; });
                    return [2 /*return*/, runs.slice(0, limit)];
                case 4:
                    if (!args.environment) return [3 /*break*/, 6];
                    return [4 /*yield*/, ctx.db
                            .query("qcRuns")
                            .withIndex("by_environment", function (q) { return q.eq("environment", args.environment); })
                            .order("desc")
                            .take(limit)];
                case 5:
                    runs = _b.sent();
                    if (args.status)
                        return [2 /*return*/, runs.filter(function (r) { return r.status === args.status; })];
                    return [2 /*return*/, runs];
                case 6: return [4 /*yield*/, ctx.db
                        .query("qcRuns")
                        .order("desc")
                        .take(limit)];
                case 7: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
/**
 * Aggregate stats per environment for dashboard health matrix
 */
exports.environmentSummary = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var runs, envs, summary, _loop_1, _i, envs_1, env;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, ctx.db.query("qcRuns").collect()];
                case 1:
                    runs = _e.sent();
                    if (args.projectId) {
                        runs = runs.filter(function (r) { return r.projectId === args.projectId; });
                    }
                    envs = ["local", "dev", "staging", "pilot", "production"];
                    summary = [];
                    _loop_1 = function (env) {
                        var envRuns = runs.filter(function (r) { return r.environment === env; });
                        var completed = envRuns.filter(function (r) { return r.status === "COMPLETED"; });
                        var sorted = __spreadArray([], completed, true).sort(function (a, b) { var _a, _b; return ((_a = b.completedAt) !== null && _a !== void 0 ? _a : 0) - ((_b = a.completedAt) !== null && _b !== void 0 ? _b : 0); });
                        var latest = (_a = sorted[0]) !== null && _a !== void 0 ? _a : null;
                        var passed = completed.filter(function (r) { return r.gatePassed === true; }).length;
                        var redCount = completed.filter(function (r) { return r.riskGrade === "RED"; }).length;
                        var yellowCount = completed.filter(function (r) { return r.riskGrade === "YELLOW"; }).length;
                        var greenCount = completed.filter(function (r) { return r.riskGrade === "GREEN"; }).length;
                        summary.push({
                            environment: env,
                            latestScore: latest ? (_b = latest.qualityScore) !== null && _b !== void 0 ? _b : null : null,
                            latestGrade: latest ? (_c = latest.riskGrade) !== null && _c !== void 0 ? _c : null : null,
                            gatePassed: latest ? (_d = latest.gatePassed) !== null && _d !== void 0 ? _d : null : null,
                            runCount: envRuns.length,
                            completedCount: completed.length,
                            passRate: completed.length ? passed / completed.length : 0,
                            redCount: redCount,
                            yellowCount: yellowCount,
                            greenCount: greenCount,
                        });
                    };
                    for (_i = 0, envs_1 = envs; _i < envs_1.length; _i++) {
                        env = envs_1[_i];
                        _loop_1(env);
                    }
                    return [2 /*return*/, summary];
            }
        });
    }); },
});
/**
 * Compare two QC runs (diff)
 */
exports.diff = (0, server_1.query)({
    args: {
        runId1: values_1.v.id("qcRuns"),
        runId2: values_1.v.id("qcRuns"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, run1, run2, _b, findings1, findings2, findingCounts1, findingCounts2;
        var _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        ctx.db.get(args.runId1),
                        ctx.db.get(args.runId2),
                    ])];
                case 1:
                    _a = _g.sent(), run1 = _a[0], run2 = _a[1];
                    if (!run1 || !run2) {
                        throw new Error("One or both runs not found");
                    }
                    return [4 /*yield*/, Promise.all([
                            ctx.db
                                .query("qcFindings")
                                .withIndex("by_run", function (q) { return q.eq("qcRunId", args.runId1); })
                                .collect(),
                            ctx.db
                                .query("qcFindings")
                                .withIndex("by_run", function (q) { return q.eq("qcRunId", args.runId2); })
                                .collect(),
                        ])];
                case 2:
                    _b = _g.sent(), findings1 = _b[0], findings2 = _b[1];
                    findingCounts1 = (_c = run1.findingCounts) !== null && _c !== void 0 ? _c : { red: 0, yellow: 0, green: 0, info: 0 };
                    findingCounts2 = (_d = run2.findingCounts) !== null && _d !== void 0 ? _d : { red: 0, yellow: 0, green: 0, info: 0 };
                    return [2 /*return*/, {
                            run1: { runId: run1.runId, runSequence: run1.runSequence, riskGrade: run1.riskGrade, qualityScore: run1.qualityScore },
                            run2: { runId: run2.runId, runSequence: run2.runSequence, riskGrade: run2.riskGrade, qualityScore: run2.qualityScore },
                            delta: {
                                qualityScore: ((_e = run2.qualityScore) !== null && _e !== void 0 ? _e : 0) - ((_f = run1.qualityScore) !== null && _f !== void 0 ? _f : 0),
                                findingCounts: {
                                    red: findingCounts2.red - findingCounts1.red,
                                    yellow: findingCounts2.yellow - findingCounts1.yellow,
                                    green: findingCounts2.green - findingCounts1.green,
                                    info: findingCounts2.info - findingCounts1.info,
                                },
                                riskGradeChanged: run1.riskGrade !== run2.riskGrade,
                            },
                            findings1Count: findings1.length,
                            findings2Count: findings2.length,
                        }];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
/**
 * Start a QC run
 */
exports.start = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        repoUrl: values_1.v.string(),
        commitSha: values_1.v.optional(values_1.v.string()),
        branch: values_1.v.optional(values_1.v.string()),
        scopeType: values_1.v.union(values_1.v.literal("FULL_REPO"), values_1.v.literal("FILE_LIST"), values_1.v.literal("DIRECTORY"), values_1.v.literal("BRANCH_DIFF")),
        scopeSpec: values_1.v.optional(values_1.v.any()),
        rulesetId: values_1.v.optional(values_1.v.id("qcRulesets")),
        initiatorType: values_1.v.optional(values_1.v.union(values_1.v.literal("HUMAN"), values_1.v.literal("AGENT"), values_1.v.literal("SYSTEM"), values_1.v.literal("WORKFLOW"))),
        initiatorId: values_1.v.optional(values_1.v.string()),
        idempotencyKey: values_1.v.optional(values_1.v.string()),
        environment: values_1.v.optional(values_1.v.union(values_1.v.literal("local"), values_1.v.literal("dev"), values_1.v.literal("staging"), values_1.v.literal("pilot"), values_1.v.literal("production"))),
        checkType: values_1.v.optional(values_1.v.union(values_1.v.literal("CODE_REVIEW"), values_1.v.literal("AGENT_OUTPUT"), values_1.v.literal("COVERAGE"), values_1.v.literal("SECURITY"), values_1.v.literal("FULL_SUITE"))),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var existing, runSequence, lastRun, now, runId, id;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    // Validate scopeType/scopeSpec alignment
                    if (args.scopeType === "FULL_REPO") {
                        if (args.scopeSpec !== null && args.scopeSpec !== undefined) {
                            throw new Error("FULL_REPO requires null or undefined scopeSpec");
                        }
                    }
                    else if (args.scopeType === "FILE_LIST") {
                        if (!Array.isArray(args.scopeSpec)) {
                            throw new Error("FILE_LIST requires string[] scopeSpec");
                        }
                        if (args.scopeSpec.length === 0) {
                            throw new Error("FILE_LIST scopeSpec cannot be empty");
                        }
                    }
                    else if (args.scopeType === "DIRECTORY") {
                        if (typeof args.scopeSpec !== "string") {
                            throw new Error("DIRECTORY requires string scopeSpec");
                        }
                        if (args.scopeSpec.trim() === "") {
                            throw new Error("DIRECTORY scopeSpec cannot be empty");
                        }
                    }
                    else if (args.scopeType === "BRANCH_DIFF") {
                        if (typeof args.scopeSpec !== "object" ||
                            args.scopeSpec === null ||
                            typeof args.scopeSpec.base !== "string" ||
                            typeof args.scopeSpec.head !== "string") {
                            throw new Error("BRANCH_DIFF requires { base: string, head: string } scopeSpec");
                        }
                        if (args.scopeSpec.base.trim() === "" || args.scopeSpec.head.trim() === "") {
                            throw new Error("BRANCH_DIFF base and head cannot be empty");
                        }
                    }
                    if (!args.idempotencyKey) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("qcRuns")
                            .withIndex("by_idempotency", function (q) { return q.eq("idempotencyKey", args.idempotencyKey); })
                            .first()];
                case 1:
                    existing = _b.sent();
                    if (existing) {
                        return [2 /*return*/, { runId: existing.runId, id: existing._id, created: false }];
                    }
                    _b.label = 2;
                case 2:
                    runSequence = 1;
                    if (!args.projectId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db
                            .query("qcRuns")
                            .withIndex("by_project_sequence", function (q) { return q.eq("projectId", args.projectId); })
                            .order("desc")
                            .first()];
                case 3:
                    lastRun = _b.sent();
                    if (lastRun) {
                        runSequence = lastRun.runSequence + 1;
                    }
                    _b.label = 4;
                case 4:
                    now = Date.now();
                    runId = generateRunId();
                    return [4 /*yield*/, ctx.db.insert("qcRuns", {
                            tenantId: undefined, // TODO: resolve from project
                            projectId: args.projectId,
                            runId: runId,
                            runSequence: runSequence,
                            status: "PENDING",
                            repoUrl: args.repoUrl,
                            commitSha: args.commitSha,
                            branch: args.branch,
                            scopeType: args.scopeType,
                            scopeSpec: args.scopeSpec,
                            rulesetId: args.rulesetId,
                            initiatorType: (_a = args.initiatorType) !== null && _a !== void 0 ? _a : "HUMAN",
                            initiatorId: args.initiatorId,
                            startedAt: now,
                            idempotencyKey: args.idempotencyKey,
                            environment: args.environment,
                            checkType: args.checkType,
                        })];
                case 5:
                    id = _b.sent();
                    // Audit log
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: undefined,
                            projectId: args.projectId,
                            type: "QC_RUN_CREATED",
                            summary: "QC run ".concat(runId, " created for ").concat(args.repoUrl),
                            relatedTable: "qcRuns",
                            relatedId: id,
                            payload: { runId: runId, repoUrl: args.repoUrl, scopeType: args.scopeType },
                        })];
                case 6:
                    // Audit log
                    _b.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendOpEvent)(ctx.db, {
                            tenantId: undefined,
                            projectId: args.projectId,
                            qcRunId: id,
                            type: "QC_RUN_STARTED",
                            payload: { runId: runId, repoUrl: args.repoUrl },
                        })];
                case 7:
                    _b.sent();
                    return [2 /*return*/, { runId: runId, id: id, created: true }];
            }
        });
    }); },
});
/**
 * Cancel a QC run
 */
exports.cancel = (0, server_1.mutation)({
    args: { id: values_1.v.id("qcRuns") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var run;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.id)];
                case 1:
                    run = _a.sent();
                    if (!run) {
                        throw new Error("QC run not found");
                    }
                    if (run.status !== "PENDING" && run.status !== "RUNNING") {
                        throw new Error("Cannot cancel run with status ".concat(run.status));
                    }
                    return [4 /*yield*/, ctx.db.patch(args.id, {
                            status: "CANCELED",
                            completedAt: Date.now(),
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
/**
 * Complete a QC run (internal)
 */
exports.complete = (0, server_1.internalMutation)({
    args: {
        id: values_1.v.id("qcRuns"),
        status: values_1.v.union(values_1.v.literal("COMPLETED"), values_1.v.literal("FAILED")),
        riskGrade: values_1.v.optional(values_1.v.union(values_1.v.literal("GREEN"), values_1.v.literal("YELLOW"), values_1.v.literal("RED"))),
        qualityScore: values_1.v.optional(values_1.v.number()),
        findingCounts: values_1.v.optional(values_1.v.object({
            red: values_1.v.number(),
            yellow: values_1.v.number(),
            green: values_1.v.number(),
            info: values_1.v.number(),
        })),
        gatePassed: values_1.v.optional(values_1.v.boolean()),
        evidenceHash: values_1.v.optional(values_1.v.string()),
        error: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var run, now, durationMs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.id)];
                case 1:
                    run = _a.sent();
                    if (!run) {
                        throw new Error("QC run not found");
                    }
                    now = Date.now();
                    durationMs = run.startedAt ? now - run.startedAt : undefined;
                    return [4 /*yield*/, ctx.db.patch(args.id, {
                            status: args.status,
                            riskGrade: args.riskGrade,
                            qualityScore: args.qualityScore,
                            findingCounts: args.findingCounts,
                            gatePassed: args.gatePassed,
                            evidenceHash: args.evidenceHash,
                            completedAt: now,
                            durationMs: durationMs,
                            metadata: args.error ? { error: args.error } : undefined,
                        })];
                case 2:
                    _a.sent();
                    // Emit completion event
                    return [4 /*yield*/, (0, armAudit_1.appendOpEvent)(ctx.db, {
                            tenantId: run.tenantId,
                            projectId: run.projectId,
                            qcRunId: args.id,
                            type: args.status === "COMPLETED" ? "QC_RUN_COMPLETED" : "QC_RUN_FAILED",
                            payload: {
                                runId: run.runId,
                                riskGrade: args.riskGrade,
                                qualityScore: args.qualityScore,
                                durationMs: durationMs,
                            },
                        })];
                case 3:
                    // Emit completion event
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
// ============================================================================
// ACTIONS
// ============================================================================
/**
 * Execute QC run (calls AssuranceAgents.AI)
 */
exports.execute = (0, server_1.action)({
    args: {
        id: values_1.v.id("qcRuns"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var run, rulesetConfig, ruleset, evidencePack, _a, evidenceHash, riskGrade, findingCounts, _i, _b, finding, gatePassed, recordedAt, env, error_1;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, ctx.runQuery(api_1.api.qcRuns.get, { id: args.id })];
                case 1:
                    run = _d.sent();
                    if (!run) {
                        throw new Error("QC run not found");
                    }
                    // Idempotency: if already completed, return
                    if (run.status === "COMPLETED") {
                        return [2 /*return*/, { success: true, runId: run.runId, alreadyCompleted: true }];
                    }
                    // Transition to RUNNING
                    return [4 /*yield*/, ctx.runMutation(api_1.internal.qcRuns.transitionToRunning, { id: args.id })];
                case 2:
                    // Transition to RUNNING
                    _d.sent();
                    _d.label = 3;
                case 3:
                    _d.trys.push([3, 24, , 26]);
                    rulesetConfig = {
                        requiredDocs: ["README.md", "docs/**/*.md"],
                        coverageThresholds: { unit: 70, integration: 50, e2e: 30 },
                        securityPaths: ["auth/**", "security/**"],
                        gateDefinitions: [
                            { name: "PRD exists", condition: "requiredDocs", severity: "YELLOW" },
                            { name: "Tests exist", condition: "coverageThresholds", severity: "RED" },
                        ],
                    };
                    if (!run.rulesetId) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.runQuery(api_1.api.qcRulesets.get, { id: run.rulesetId })];
                case 4:
                    ruleset = _d.sent();
                    if (ruleset) {
                        rulesetConfig = {
                            requiredDocs: ruleset.requiredDocs,
                            coverageThresholds: ruleset.coverageThresholds,
                            securityPaths: ruleset.securityPaths,
                            gateDefinitions: ruleset.gateDefinitions,
                        };
                    }
                    _d.label = 5;
                case 5:
                    if (!(run.checkType === "AGENT_OUTPUT")) return [3 /*break*/, 7];
                    return [4 /*yield*/, mockAgentOutputCall({ runId: run.runId })];
                case 6:
                    _a = _d.sent();
                    return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, mockAssuranceCall({
                        runId: run.runId,
                        repoUrl: run.repoUrl,
                        commitSha: run.commitSha,
                        branch: run.branch,
                        scopeType: run.scopeType,
                        scopeSpec: run.scopeSpec,
                        rulesetConfig: rulesetConfig,
                    })];
                case 8:
                    _a = _d.sent();
                    _d.label = 9;
                case 9:
                    evidencePack = _a;
                    // Validate schemaVersion
                    if (!evidencePack.schemaVersion) {
                        throw new Error("Evidence pack missing required schemaVersion field");
                    }
                    return [4 /*yield*/, computeEvidenceHash(evidencePack)];
                case 10:
                    evidenceHash = _d.sent();
                    riskGrade = computeRiskGrade(evidencePack.deliveryGates);
                    findingCounts = {
                        red: evidencePack.findings.filter(function (f) { return f.severity === "RED"; }).length,
                        yellow: evidencePack.findings.filter(function (f) { return f.severity === "YELLOW"; }).length,
                        green: evidencePack.findings.filter(function (f) { return f.severity === "GREEN"; }).length,
                        info: evidencePack.findings.filter(function (f) { return f.severity === "INFO"; }).length,
                    };
                    _i = 0, _b = evidencePack.findings;
                    _d.label = 11;
                case 11:
                    if (!(_i < _b.length)) return [3 /*break*/, 14];
                    finding = _b[_i];
                    return [4 /*yield*/, ctx.runMutation(api_1.internal.qcFindings.insert, {
                            qcRunId: args.id,
                            tenantId: run.tenantId,
                            projectId: run.projectId,
                            severity: finding.severity,
                            category: finding.category,
                            title: finding.title,
                            description: finding.description,
                            filePaths: finding.filePaths,
                            lineRanges: finding.lineRanges,
                            prdRefs: finding.prdRefs,
                            suggestedFix: finding.suggestedFix,
                            confidence: finding.confidence,
                        })];
                case 12:
                    _d.sent();
                    _d.label = 13;
                case 13:
                    _i++;
                    return [3 /*break*/, 11];
                case 14: 
                // Store artifacts
                return [4 /*yield*/, ctx.runMutation(api_1.internal.qcArtifacts.store, {
                        qcRunId: args.id,
                        tenantId: run.tenantId,
                        projectId: run.projectId,
                        type: "EVIDENCE_PACK_JSON",
                        name: "".concat(run.runId, "_evidence_pack.json"),
                        content: JSON.stringify(evidencePack, null, 2),
                        mimeType: "application/json",
                        sizeBytes: JSON.stringify(evidencePack).length,
                    })];
                case 15:
                    // Store artifacts
                    _d.sent();
                    return [4 /*yield*/, ctx.runMutation(api_1.internal.qcArtifacts.store, {
                            qcRunId: args.id,
                            tenantId: run.tenantId,
                            projectId: run.projectId,
                            type: "SUMMARY_MD",
                            name: "".concat(run.runId, "_summary.md"),
                            content: evidencePack.summary,
                            mimeType: "text/markdown",
                            sizeBytes: evidencePack.summary.length,
                        })];
                case 16:
                    _d.sent();
                    gatePassed = evidencePack.deliveryGates.every(function (g) { return g.passed; });
                    return [4 /*yield*/, ctx.runMutation(api_1.internal.qcRuns.complete, {
                            id: args.id,
                            status: "COMPLETED",
                            riskGrade: riskGrade,
                            qualityScore: evidencePack.qualityScore,
                            findingCounts: findingCounts,
                            gatePassed: gatePassed,
                            evidenceHash: evidenceHash,
                        })];
                case 17:
                    _d.sent();
                    recordedAt = Date.now();
                    env = (_c = run.environment) !== null && _c !== void 0 ? _c : undefined;
                    return [4 /*yield*/, ctx.runMutation(api_1.internal.qcMetrics.record, {
                            projectId: run.projectId,
                            environment: env,
                            metricName: "quality_score",
                            value: evidencePack.qualityScore,
                            unit: "percent",
                            qcRunId: args.id,
                            recordedAt: recordedAt,
                        })];
                case 18:
                    _d.sent();
                    return [4 /*yield*/, ctx.runMutation(api_1.internal.qcMetrics.record, {
                            projectId: run.projectId,
                            environment: env,
                            metricName: "gate_passed",
                            value: gatePassed ? 1 : 0,
                            unit: "count",
                            qcRunId: args.id,
                            recordedAt: recordedAt,
                        })];
                case 19:
                    _d.sent();
                    return [4 /*yield*/, ctx.runMutation(api_1.internal.qcMetrics.record, {
                            projectId: run.projectId,
                            environment: env,
                            metricName: "findings_red",
                            value: findingCounts.red,
                            unit: "count",
                            qcRunId: args.id,
                            recordedAt: recordedAt,
                        })];
                case 20:
                    _d.sent();
                    return [4 /*yield*/, ctx.runMutation(api_1.internal.qcMetrics.record, {
                            projectId: run.projectId,
                            environment: env,
                            metricName: "findings_yellow",
                            value: findingCounts.yellow,
                            unit: "count",
                            qcRunId: args.id,
                            recordedAt: recordedAt,
                        })];
                case 21:
                    _d.sent();
                    if (!(riskGrade === "RED")) return [3 /*break*/, 23];
                    return [4 /*yield*/, ctx.runMutation(api_1.api.alerts.create, {
                            projectId: run.projectId,
                            severity: "CRITICAL",
                            type: "QC_GATE_FAILED",
                            title: "QC Run ".concat(run.runId, " failed RED gate"),
                            description: "Quality Control run for ".concat(run.repoUrl, " failed critical delivery gates. Review findings immediately."),
                            metadata: { qcRunId: args.id, runId: run.runId },
                        })];
                case 22:
                    _d.sent();
                    _d.label = 23;
                case 23: return [2 /*return*/, { success: true, runId: run.runId, riskGrade: riskGrade, qualityScore: evidencePack.qualityScore }];
                case 24:
                    error_1 = _d.sent();
                    // Mark as failed
                    return [4 /*yield*/, ctx.runMutation(api_1.internal.qcRuns.complete, {
                            id: args.id,
                            status: "FAILED",
                            error: error_1.message,
                        })];
                case 25:
                    // Mark as failed
                    _d.sent();
                    throw error_1;
                case 26: return [2 /*return*/];
            }
        });
    }); },
});
/**
 * Transition run to RUNNING (internal)
 */
exports.transitionToRunning = (0, server_1.internalMutation)({
    args: { id: values_1.v.id("qcRuns") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.patch(args.id, { status: "RUNNING" })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
});
// ============================================================================
// MOCK ASSURANCE CALL (STUB for v1)
// ============================================================================
function mockAssuranceCall(request) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            // Mock evidence pack for testing
            return [2 /*return*/, {
                    schemaVersion: "1.0.0",
                    producer: "assurance-agents-stub/0.1.0",
                    runId: request.runId,
                    repoUrl: request.repoUrl,
                    commitSha: (_a = request.commitSha) !== null && _a !== void 0 ? _a : "abc123def456",
                    timestamp: new Date().toISOString(),
                    docsIndex: [
                        { path: "README.md", type: "README", lastModified: "2026-02-15T10:00:00Z" },
                        { path: "docs/PRD_V2.md", type: "PRD", lastModified: "2026-02-10T14:30:00Z" },
                    ],
                    requirementTraceability: [
                        {
                            requirementId: "REQ-001",
                            requirementText: "System must support multi-agent workflows",
                            sourceDoc: "docs/PRD_V2.md",
                            implementationFiles: [
                                { path: "packages/workflow-engine/src/executor.ts", lineRange: [1, 50] },
                            ],
                            testFiles: [
                                { path: "packages/workflow-engine/src/__tests__/executor.test.ts" },
                            ],
                            evidence: "Workflow engine implements deterministic multi-agent execution",
                            status: "COVERED",
                        },
                    ],
                    findings: [
                        {
                            severity: "YELLOW",
                            category: "DOCS_DRIFT",
                            title: "README outdated",
                            description: "README.md last updated 5 days before recent code changes",
                            filePaths: ["README.md"],
                            confidence: 0.85,
                        },
                        {
                            severity: "GREEN",
                            category: "COVERAGE_GAP",
                            title: "Test coverage acceptable",
                            description: "Unit test coverage at 78%, above threshold",
                            confidence: 0.95,
                        },
                    ],
                    coverageSummary: {
                        unit: { covered: 156, total: 200, percentage: 78 },
                        integration: { covered: 24, total: 40, percentage: 60 },
                        e2e: { covered: 8, total: 15, percentage: 53 },
                        missingAreas: ["Error handling in workflow executor"],
                    },
                    deliveryGates: [
                        {
                            name: "PRD exists",
                            passed: true,
                            rationale: "Found docs/PRD_V2.md",
                            severity: "YELLOW",
                        },
                        {
                            name: "Tests exist",
                            passed: true,
                            rationale: "Test coverage above minimum threshold",
                            severity: "RED",
                        },
                    ],
                    riskGrade: "YELLOW",
                    qualityScore: 82,
                    policyNotes: ["All gates passed except docs drift"],
                    summary: "# QC Run ".concat(request.runId, "\n\n**Status:** PASSED (with warnings)\n\n## Findings\n- 1 YELLOW: README outdated\n- 1 GREEN: Coverage acceptable\n\n## Coverage\n- Unit: 78%\n- Integration: 60%\n- E2E: 53%"),
                }];
        });
    });
}
/**
 * Mock agent output QC (task completion, format compliance, hallucination detection)
 */
function mockAgentOutputCall(request) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, {
                    schemaVersion: "1.0.0",
                    producer: "assurance-agents-stub/agent-output/0.1.0",
                    runId: request.runId,
                    repoUrl: "",
                    commitSha: "",
                    timestamp: new Date().toISOString(),
                    docsIndex: [],
                    requirementTraceability: [],
                    findings: [
                        {
                            severity: "GREEN",
                            category: "TASK_INCOMPLETE",
                            title: "Task completion rate",
                            description: "Agent task completion rate within acceptable range",
                            confidence: 0.92,
                        },
                        {
                            severity: "YELLOW",
                            category: "OUTPUT_FORMAT_ERROR",
                            title: "Format compliance",
                            description: "One output did not match expected schema",
                            confidence: 0.78,
                        },
                    ],
                    coverageSummary: {
                        unit: { covered: 0, total: 0, percentage: 0 },
                        integration: { covered: 0, total: 0, percentage: 0 },
                        e2e: { covered: 0, total: 0, percentage: 0 },
                        missingAreas: [],
                    },
                    deliveryGates: [
                        { name: "Task completion", passed: true, rationale: "Completion rate above threshold", severity: "GREEN" },
                        { name: "Format compliance", passed: true, rationale: "Minor format issues only", severity: "YELLOW" },
                    ],
                    riskGrade: "GREEN",
                    qualityScore: 88,
                    policyNotes: [],
                    summary: "# Agent Output QC ".concat(request.runId, "\n\n**Status:** PASSED\n\nTask completion and format compliance within acceptable range."),
                }];
        });
    });
}

"use strict";
/**
 * QC Findings — Convex Functions
 *
 * Individual quality check results.
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
exports.insert = exports.listRecent = exports.listByRun = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
// ============================================================================
// QUERIES
// ============================================================================
/**
 * List findings for a QC run
 */
exports.listByRun = (0, server_1.query)({
    args: {
        qcRunId: values_1.v.id("qcRuns"),
        severity: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var findings, severityOrder;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("qcFindings")
                        .withIndex("by_run", function (q) { return q.eq("qcRunId", args.qcRunId); })
                        .collect()];
                case 1:
                    findings = _a.sent();
                    if (args.severity) {
                        findings = findings.filter(function (f) { return f.severity === args.severity; });
                    }
                    severityOrder = { RED: 0, YELLOW: 1, GREEN: 2, INFO: 3 };
                    findings.sort(function (a, b) { return severityOrder[a.severity] - severityOrder[b.severity]; });
                    return [2 /*return*/, findings];
            }
        });
    }); },
});
/**
 * List recent findings across runs (for findings browser)
 */
exports.listRecent = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        environment: values_1.v.optional(values_1.v.union(values_1.v.literal("local"), values_1.v.literal("dev"), values_1.v.literal("staging"), values_1.v.literal("pilot"), values_1.v.literal("production"))),
        severity: values_1.v.optional(values_1.v.string()),
        category: values_1.v.optional(values_1.v.string()),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit, runs, runIds, runMap, findings, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    limit = (_b = args.limit) !== null && _b !== void 0 ? _b : 100;
                    return [4 /*yield*/, ctx.db.query("qcRuns").order("desc").take(100)];
                case 1:
                    runs = _c.sent();
                    if (args.projectId) {
                        runs = runs.filter(function (r) { return r.projectId === args.projectId; });
                    }
                    if (args.environment) {
                        runs = runs.filter(function (r) { return r.environment === args.environment; });
                    }
                    runIds = new Set(runs.map(function (r) { return r._id; }));
                    runMap = new Map(runs.map(function (r) { return [r._id, r]; }));
                    if (!args.projectId) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db
                            .query("qcFindings")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 2:
                    _a = _c.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, ctx.db.query("qcFindings").collect()];
                case 4:
                    _a = _c.sent();
                    _c.label = 5;
                case 5:
                    findings = _a;
                    findings = findings.filter(function (f) { return runIds.has(f.qcRunId); });
                    if (args.severity)
                        findings = findings.filter(function (f) { return f.severity === args.severity; });
                    if (args.category)
                        findings = findings.filter(function (f) { return f.category === args.category; });
                    findings.sort(function (a, b) { var _a, _b; return ((_a = b._creationTime) !== null && _a !== void 0 ? _a : 0) - ((_b = a._creationTime) !== null && _b !== void 0 ? _b : 0); });
                    findings = findings.slice(0, limit);
                    return [2 /*return*/, findings.map(function (f) {
                            var _a, _b;
                            var run = runMap.get(f.qcRunId);
                            return __assign(__assign({}, f), { runId: (_a = run === null || run === void 0 ? void 0 : run.runId) !== null && _a !== void 0 ? _a : null, environment: (_b = run === null || run === void 0 ? void 0 : run.environment) !== null && _b !== void 0 ? _b : null });
                        })];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
/**
 * Insert a finding (internal)
 */
exports.insert = (0, server_1.internalMutation)({
    args: {
        qcRunId: values_1.v.id("qcRuns"),
        tenantId: values_1.v.optional(values_1.v.id("tenants")),
        projectId: values_1.v.optional(values_1.v.id("projects")),
        severity: values_1.v.union(values_1.v.literal("RED"), values_1.v.literal("YELLOW"), values_1.v.literal("GREEN"), values_1.v.literal("INFO")),
        category: values_1.v.union(values_1.v.literal("REQUIREMENT_GAP"), values_1.v.literal("DOCS_DRIFT"), values_1.v.literal("COVERAGE_GAP"), values_1.v.literal("SECURITY_GAP"), values_1.v.literal("CONFIG_MISSING"), values_1.v.literal("DELIVERY_GATE"), values_1.v.literal("AGENT_HALLUCINATION"), values_1.v.literal("TASK_INCOMPLETE"), values_1.v.literal("OUTPUT_FORMAT_ERROR"), values_1.v.literal("PERFORMANCE_REGRESSION"), values_1.v.literal("DEPENDENCY_RISK")),
        title: values_1.v.string(),
        description: values_1.v.string(),
        filePaths: values_1.v.optional(values_1.v.array(values_1.v.string())),
        lineRanges: values_1.v.optional(values_1.v.array(values_1.v.object({
            file: values_1.v.string(),
            start: values_1.v.number(),
            end: values_1.v.number(),
        }))),
        prdRefs: values_1.v.optional(values_1.v.array(values_1.v.string())),
        suggestedFix: values_1.v.optional(values_1.v.string()),
        confidence: values_1.v.optional(values_1.v.number()),
        linkedTaskId: values_1.v.optional(values_1.v.id("tasks")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.insert("qcFindings", {
                        qcRunId: args.qcRunId,
                        tenantId: args.tenantId,
                        projectId: args.projectId,
                        severity: args.severity,
                        category: args.category,
                        title: args.title,
                        description: args.description,
                        filePaths: args.filePaths,
                        lineRanges: args.lineRanges,
                        prdRefs: args.prdRefs,
                        suggestedFix: args.suggestedFix,
                        confidence: args.confidence,
                        linkedTaskId: args.linkedTaskId,
                    })];
                case 1:
                    id = _a.sent();
                    return [2 /*return*/, { id: id }];
            }
        });
    }); },
});

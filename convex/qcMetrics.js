"use strict";
/**
 * QC Metrics — Convex Functions
 *
 * Time-series quality data for dashboards and trends.
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
exports.record = exports.latestByEnvironment = exports.aggregate = exports.listByEnvironment = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var environmentUnion = values_1.v.optional(values_1.v.union(values_1.v.literal("local"), values_1.v.literal("dev"), values_1.v.literal("staging"), values_1.v.literal("pilot"), values_1.v.literal("production")));
// ============================================================================
// QUERIES
// ============================================================================
/**
 * List metrics for an environment in a time range
 */
exports.listByEnvironment = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        environment: environmentUnion,
        metricName: values_1.v.optional(values_1.v.string()),
        fromTs: values_1.v.optional(values_1.v.number()),
        toTs: values_1.v.optional(values_1.v.number()),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var rows, limit;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(args.projectId !== undefined && args.environment)) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("qcMetrics")
                            .withIndex("by_project_env", function (q) {
                            return q.eq("projectId", args.projectId).eq("environment", args.environment);
                        })
                            .collect()];
                case 1:
                    rows = _b.sent();
                    return [3 /*break*/, 8];
                case 2:
                    if (!(args.projectId !== undefined)) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db
                            .query("qcMetrics")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 3:
                    rows = _b.sent();
                    if (args.environment)
                        rows = rows.filter(function (r) { return r.environment === args.environment; });
                    return [3 /*break*/, 8];
                case 4:
                    if (!args.environment) return [3 /*break*/, 6];
                    return [4 /*yield*/, ctx.db
                            .query("qcMetrics")
                            .withIndex("by_environment", function (q) { return q.eq("environment", args.environment); })
                            .collect()];
                case 5:
                    rows = _b.sent();
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, ctx.db.query("qcMetrics").collect()];
                case 7:
                    rows = _b.sent();
                    _b.label = 8;
                case 8:
                    if (args.metricName) {
                        rows = rows.filter(function (r) { return r.metricName === args.metricName; });
                    }
                    if (args.fromTs !== undefined) {
                        rows = rows.filter(function (r) { return r.recordedAt >= args.fromTs; });
                    }
                    if (args.toTs !== undefined) {
                        rows = rows.filter(function (r) { return r.recordedAt <= args.toTs; });
                    }
                    rows.sort(function (a, b) { return b.recordedAt - a.recordedAt; });
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 200;
                    return [2 /*return*/, rows.slice(0, limit)];
            }
        });
    }); },
});
/**
 * Aggregate stats (min, max, avg, p95) per metric name and environment
 */
exports.aggregate = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        environment: environmentUnion,
        metricName: values_1.v.optional(values_1.v.string()),
        fromTs: values_1.v.optional(values_1.v.number()),
        toTs: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var rows, byKey, _i, rows_1, r, key, result, _a, _b, _c, key, values, _d, metricName, env, sorted, min, max, sum, avg, p95Idx, p95;
        var _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0: return [4 /*yield*/, ctx.db.query("qcMetrics").collect()];
                case 1:
                    rows = _j.sent();
                    if (args.projectId !== undefined) {
                        rows = rows.filter(function (r) { return r.projectId === args.projectId; });
                    }
                    if (args.environment) {
                        rows = rows.filter(function (r) { return r.environment === args.environment; });
                    }
                    if (args.metricName) {
                        rows = rows.filter(function (r) { return r.metricName === args.metricName; });
                    }
                    if (args.fromTs !== undefined) {
                        rows = rows.filter(function (r) { return r.recordedAt >= args.fromTs; });
                    }
                    if (args.toTs !== undefined) {
                        rows = rows.filter(function (r) { return r.recordedAt <= args.toTs; });
                    }
                    byKey = {};
                    for (_i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                        r = rows_1[_i];
                        key = "".concat(r.metricName, "|").concat((_e = r.environment) !== null && _e !== void 0 ? _e : "none");
                        if (!byKey[key])
                            byKey[key] = [];
                        byKey[key].push(r.value);
                    }
                    result = [];
                    for (_a = 0, _b = Object.entries(byKey); _a < _b.length; _a++) {
                        _c = _b[_a], key = _c[0], values = _c[1];
                        _d = key.split("|"), metricName = _d[0], env = _d[1];
                        sorted = __spreadArray([], values, true).sort(function (a, b) { return a - b; });
                        min = (_f = sorted[0]) !== null && _f !== void 0 ? _f : 0;
                        max = (_g = sorted[sorted.length - 1]) !== null && _g !== void 0 ? _g : 0;
                        sum = values.reduce(function (a, b) { return a + b; }, 0);
                        avg = values.length ? sum / values.length : 0;
                        p95Idx = Math.floor(sorted.length * 0.95);
                        p95 = (_h = sorted[p95Idx]) !== null && _h !== void 0 ? _h : 0;
                        result.push({
                            metricName: metricName,
                            environment: env === "none" ? null : env,
                            min: min,
                            max: max,
                            avg: avg,
                            p95: p95,
                            count: values.length,
                        });
                    }
                    return [2 /*return*/, result];
            }
        });
    }); },
});
/**
 * Latest value of each metric per environment (for sparklines)
 */
exports.latestByEnvironment = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        environment: environmentUnion,
        metricNames: values_1.v.optional(values_1.v.array(values_1.v.string())),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var rows, set_1, latest, _i, rows_2, r, key, existing;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, ctx.db.query("qcMetrics").collect()];
                case 1:
                    rows = _c.sent();
                    if (args.projectId !== undefined) {
                        rows = rows.filter(function (r) { return r.projectId === args.projectId; });
                    }
                    if (args.environment) {
                        rows = rows.filter(function (r) { return r.environment === args.environment; });
                    }
                    if ((_a = args.metricNames) === null || _a === void 0 ? void 0 : _a.length) {
                        set_1 = new Set(args.metricNames);
                        rows = rows.filter(function (r) { return set_1.has(r.metricName); });
                    }
                    latest = {};
                    for (_i = 0, rows_2 = rows; _i < rows_2.length; _i++) {
                        r = rows_2[_i];
                        key = "".concat(r.metricName, "|").concat((_b = r.environment) !== null && _b !== void 0 ? _b : "none");
                        existing = latest[key];
                        if (!existing || r.recordedAt > existing.recordedAt) {
                            latest[key] = { value: r.value, recordedAt: r.recordedAt };
                        }
                    }
                    return [2 /*return*/, latest];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS (internal)
// ============================================================================
/**
 * Record a metric data point (called from QC execute action)
 */
exports.record = (0, server_1.internalMutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        environment: environmentUnion,
        metricName: values_1.v.string(),
        value: values_1.v.number(),
        unit: values_1.v.string(),
        qcRunId: values_1.v.optional(values_1.v.id("qcRuns")),
        recordedAt: values_1.v.number(),
        tags: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.insert("qcMetrics", {
                        projectId: args.projectId,
                        environment: args.environment,
                        metricName: args.metricName,
                        value: args.value,
                        unit: args.unit,
                        qcRunId: args.qcRunId,
                        recordedAt: args.recordedAt,
                        tags: args.tags,
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
});

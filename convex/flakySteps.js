"use strict";
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
exports.markResolved = exports.recordRun = exports.get = exports.list = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
exports.list = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        activeOnly: values_1.v.optional(values_1.v.boolean()),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var rows, _a;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db.query("flakySteps").withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); }).order("desc").take((_b = args.limit) !== null && _b !== void 0 ? _b : 100)];
                case 1:
                    _a = _d.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("flakySteps").order("desc").take((_c = args.limit) !== null && _c !== void 0 ? _c : 100)];
                case 3:
                    _a = _d.sent();
                    _d.label = 4;
                case 4:
                    rows = _a;
                    return [2 /*return*/, args.activeOnly ? rows.filter(function (row) { return row.isActive; }) : rows];
            }
        });
    }); },
});
exports.get = (0, server_1.query)({
    args: { id: values_1.v.id("flakySteps") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, ctx.db.get(args.id)];
            case 1: return [2 /*return*/, _a.sent()];
        }
    }); }); },
});
exports.recordRun = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        stepName: values_1.v.string(),
        status: values_1.v.union(values_1.v.literal("passed"), values_1.v.literal("failed")),
        responseTimeMs: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var existing, now, id, totalRuns, failedRuns, failureRatio, avgResponseTimeMs;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.query("flakySteps").withIndex("by_step", function (q) { return q.eq("stepName", args.stepName); }).first()];
                case 1:
                    existing = _b.sent();
                    now = Date.now();
                    if (!!existing) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db.insert("flakySteps", {
                            tenantId: undefined,
                            projectId: args.projectId,
                            stepName: args.stepName,
                            failureRatio: args.status === "failed" ? 1 : 0,
                            totalRuns: 1,
                            failedRuns: args.status === "failed" ? 1 : 0,
                            lastSeen: now,
                            firstDetected: now,
                            isActive: args.status === "failed",
                            retryCount: 0,
                            avgResponseTimeMs: args.responseTimeMs,
                        })];
                case 2:
                    id = _b.sent();
                    return [2 /*return*/, { id: id, created: true }];
                case 3:
                    totalRuns = existing.totalRuns + 1;
                    failedRuns = existing.failedRuns + (args.status === "failed" ? 1 : 0);
                    failureRatio = failedRuns / Math.max(totalRuns, 1);
                    avgResponseTimeMs = args.responseTimeMs === undefined
                        ? existing.avgResponseTimeMs
                        : existing.avgResponseTimeMs === undefined
                            ? args.responseTimeMs
                            : Math.round((existing.avgResponseTimeMs * existing.totalRuns + args.responseTimeMs) / totalRuns);
                    return [4 /*yield*/, ctx.db.patch(existing._id, {
                            projectId: (_a = args.projectId) !== null && _a !== void 0 ? _a : existing.projectId,
                            totalRuns: totalRuns,
                            failedRuns: failedRuns,
                            failureRatio: failureRatio,
                            lastSeen: now,
                            isActive: failureRatio >= 0.2,
                            avgResponseTimeMs: avgResponseTimeMs,
                        })];
                case 4:
                    _b.sent();
                    return [2 /*return*/, { id: existing._id, created: false, failureRatio: failureRatio }];
            }
        });
    }); },
});
exports.markResolved = (0, server_1.mutation)({
    args: { id: values_1.v.id("flakySteps") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.patch(args.id, { isActive: false })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});

"use strict";
/**
 * Alerts — Convex Functions
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
exports.ignore = exports.resolve = exports.acknowledge = exports.create = exports.listByAgent = exports.listBySeverity = exports.listOpen = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
// ============================================================================
// QUERIES
// ============================================================================
exports.listOpen = (0, server_1.query)({
    args: { limit: values_1.v.optional(values_1.v.number()) },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("alerts")
                        .withIndex("by_status", function (q) { return q.eq("status", "OPEN"); })
                        .order("desc")
                        .take((_a = args.limit) !== null && _a !== void 0 ? _a : 50)];
                case 1: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
exports.listBySeverity = (0, server_1.query)({
    args: {
        severity: values_1.v.string(),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("alerts")
                        .withIndex("by_severity", function (q) { return q.eq("severity", args.severity); })
                        .order("desc")
                        .take((_a = args.limit) !== null && _a !== void 0 ? _a : 50)];
                case 1: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
exports.listByAgent = (0, server_1.query)({
    args: {
        agentId: values_1.v.id("agents"),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("alerts")
                        .withIndex("by_agent", function (q) { return q.eq("agentId", args.agentId); })
                        .order("desc")
                        .take((_a = args.limit) !== null && _a !== void 0 ? _a : 50)];
                case 1: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
exports.create = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        severity: values_1.v.string(),
        type: values_1.v.string(),
        title: values_1.v.string(),
        description: values_1.v.string(),
        agentId: values_1.v.optional(values_1.v.id("agents")),
        taskId: values_1.v.optional(values_1.v.id("tasks")),
        runId: values_1.v.optional(values_1.v.id("runs")),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var alertId;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.insert("alerts", {
                        projectId: args.projectId,
                        severity: args.severity,
                        type: args.type,
                        title: args.title,
                        description: args.description,
                        agentId: args.agentId,
                        taskId: args.taskId,
                        runId: args.runId,
                        status: "OPEN",
                        metadata: args.metadata,
                    })];
                case 1:
                    alertId = _b.sent();
                    _a = {};
                    return [4 /*yield*/, ctx.db.get(alertId)];
                case 2: return [2 /*return*/, (_a.alert = _b.sent(), _a)];
            }
        });
    }); },
});
exports.acknowledge = (0, server_1.mutation)({
    args: {
        alertId: values_1.v.id("alerts"),
        acknowledgedBy: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.patch(args.alertId, {
                        status: "ACKNOWLEDGED",
                        acknowledgedBy: args.acknowledgedBy,
                        acknowledgedAt: Date.now(),
                    })];
                case 1:
                    _b.sent();
                    _a = {};
                    return [4 /*yield*/, ctx.db.get(args.alertId)];
                case 2: return [2 /*return*/, (_a.alert = _b.sent(), _a)];
            }
        });
    }); },
});
exports.resolve = (0, server_1.mutation)({
    args: {
        alertId: values_1.v.id("alerts"),
        resolutionNote: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.patch(args.alertId, {
                        status: "RESOLVED",
                        resolvedAt: Date.now(),
                        resolutionNote: args.resolutionNote,
                    })];
                case 1:
                    _b.sent();
                    _a = {};
                    return [4 /*yield*/, ctx.db.get(args.alertId)];
                case 2: return [2 /*return*/, (_a.alert = _b.sent(), _a)];
            }
        });
    }); },
});
exports.ignore = (0, server_1.mutation)({
    args: {
        alertId: values_1.v.id("alerts"),
        reason: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.patch(args.alertId, {
                        status: "IGNORED",
                        resolutionNote: args.reason,
                    })];
                case 1:
                    _b.sent();
                    _a = {};
                    return [4 /*yield*/, ctx.db.get(args.alertId)];
                case 2: return [2 /*return*/, (_a.alert = _b.sent(), _a)];
            }
        });
    }); },
});

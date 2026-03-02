"use strict";
/**
 * Revenue Events — Stripe / external revenue tracking
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
exports.record = exports.summary = exports.list = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
// ============================================================================
// QUERIES
// ============================================================================
exports.list = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 50;
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("revenueEvents")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .order("desc")
                            .take(limit)];
                case 1: return [2 /*return*/, _b.sent()];
                case 2: return [4 /*yield*/, ctx.db.query("revenueEvents").order("desc").take(limit)];
                case 3: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
exports.summary = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var events, now, thirtyDaysAgo, totalRevenue, totalRefunds, last30Days, recentEvents;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("revenueEvents")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 1:
                    events = _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("revenueEvents").collect()];
                case 3:
                    events = _a.sent();
                    _a.label = 4;
                case 4:
                    now = Date.now();
                    thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
                    totalRevenue = events
                        .filter(function (e) { return e.eventType !== "REFUND"; })
                        .reduce(function (sum, e) { return sum + e.amount; }, 0);
                    totalRefunds = events
                        .filter(function (e) { return e.eventType === "REFUND"; })
                        .reduce(function (sum, e) { return sum + e.amount; }, 0);
                    last30Days = events
                        .filter(function (e) { return e.timestamp >= thirtyDaysAgo && e.eventType !== "REFUND"; })
                        .reduce(function (sum, e) { return sum + e.amount; }, 0);
                    recentEvents = events
                        .sort(function (a, b) { return b.timestamp - a.timestamp; })
                        .slice(0, 5);
                    return [2 /*return*/, {
                            totalRevenue: totalRevenue,
                            totalRefunds: totalRefunds,
                            netRevenue: totalRevenue - totalRefunds,
                            last30Days: last30Days,
                            eventCount: events.length,
                            recentEvents: recentEvents,
                        }];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
exports.record = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        source: values_1.v.union(values_1.v.literal("STRIPE"), values_1.v.literal("MANUAL"), values_1.v.literal("OTHER")),
        eventType: values_1.v.union(values_1.v.literal("CHARGE"), values_1.v.literal("SUBSCRIPTION"), values_1.v.literal("REFUND"), values_1.v.literal("PAYOUT"), values_1.v.literal("OTHER")),
        amount: values_1.v.number(),
        currency: values_1.v.string(),
        description: values_1.v.optional(values_1.v.string()),
        customerId: values_1.v.optional(values_1.v.string()),
        customerEmail: values_1.v.optional(values_1.v.string()),
        externalId: values_1.v.optional(values_1.v.string()),
        externalRef: values_1.v.optional(values_1.v.string()),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var existing, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.externalId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("revenueEvents")
                            .withIndex("by_external_id", function (q) { return q.eq("externalId", args.externalId); })
                            .first()];
                case 1:
                    existing = _a.sent();
                    if (existing)
                        return [2 /*return*/, existing._id];
                    _a.label = 2;
                case 2: return [4 /*yield*/, ctx.db.insert("revenueEvents", {
                        projectId: args.projectId,
                        source: args.source,
                        eventType: args.eventType,
                        amount: args.amount,
                        currency: args.currency,
                        description: args.description,
                        customerId: args.customerId,
                        customerEmail: args.customerEmail,
                        externalId: args.externalId,
                        externalRef: args.externalRef,
                        timestamp: Date.now(),
                        metadata: args.metadata,
                    })];
                case 3:
                    id = _a.sent();
                    return [2 /*return*/, id];
            }
        });
    }); },
});

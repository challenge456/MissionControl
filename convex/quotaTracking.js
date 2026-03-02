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
exports.getProjectedBurnRate = exports.getLatestSnapshot = exports.upsertQuotaSnapshot = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
exports.upsertQuotaSnapshot = (0, server_1.mutation)({
    args: {
        provider: values_1.v.union(values_1.v.literal("anthropic"), values_1.v.literal("openai"), values_1.v.literal("google")),
        planTier: values_1.v.string(),
        usagePct: values_1.v.number(),
        resetAt: values_1.v.number(),
        tokensUsed: values_1.v.number(),
        tokensLimit: values_1.v.number(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var recordedAt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    recordedAt = Date.now();
                    return [4 /*yield*/, ctx.db.insert("quotaSnapshots", {
                            provider: args.provider,
                            planTier: args.planTier,
                            usagePct: args.usagePct,
                            resetAt: args.resetAt,
                            tokensUsed: args.tokensUsed,
                            tokensLimit: args.tokensLimit,
                            recordedAt: recordedAt,
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { recordedAt: recordedAt }];
            }
        });
    }); },
});
exports.getLatestSnapshot = (0, server_1.query)({
    args: {
        provider: values_1.v.optional(values_1.v.union(values_1.v.literal("anthropic"), values_1.v.literal("openai"), values_1.v.literal("google"))),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var all, filtered;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("quotaSnapshots")
                        .withIndex("by_recorded_at", function (q) { return q.gte("recordedAt", 0); })
                        .order("desc")
                        .take(100)];
                case 1:
                    all = _a.sent();
                    filtered = args.provider ? all.filter(function (r) { return r.provider === args.provider; }) : all;
                    if (filtered.length === 0)
                        return [2 /*return*/, null];
                    return [2 /*return*/, filtered[0]];
            }
        });
    }); },
});
/** Projected burn rate: linear regression over last 24h of snapshots, returns % per day and projected % at reset. */
exports.getProjectedBurnRate = (0, server_1.query)({
    args: {
        provider: values_1.v.optional(values_1.v.union(values_1.v.literal("anthropic"), values_1.v.literal("openai"), values_1.v.literal("google"))),
        windowMs: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var windowMs, cutoff, rows, points, n, sumT, sumY, sumTT, sumTY, slope, msPerDay, pctPerDay, latest, resetAt, msToReset, projectedAtReset;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    windowMs = (_a = args.windowMs) !== null && _a !== void 0 ? _a : 24 * 60 * 60 * 1000;
                    cutoff = Date.now() - windowMs;
                    return [4 /*yield*/, ctx.db
                            .query("quotaSnapshots")
                            .withIndex("by_recorded_at", function (q) { return q.gte("recordedAt", cutoff); })
                            .order("desc")
                            .take(100)];
                case 1:
                    rows = _d.sent();
                    if (args.provider)
                        rows = rows.filter(function (r) { return r.provider === args.provider; });
                    if (rows.length < 2)
                        return [2 /*return*/, null];
                    points = rows.map(function (r) { return ({ t: r.recordedAt, y: r.usagePct }); });
                    n = points.length;
                    sumT = points.reduce(function (a, p) { return a + p.t; }, 0);
                    sumY = points.reduce(function (a, p) { return a + p.y; }, 0);
                    sumTT = points.reduce(function (a, p) { return a + p.t * p.t; }, 0);
                    sumTY = points.reduce(function (a, p) { return a + p.t * p.y; }, 0);
                    slope = (n * sumTY - sumT * sumY) / (n * sumTT - sumT * sumT);
                    if (!Number.isFinite(slope))
                        return [2 /*return*/, null];
                    msPerDay = 86400 * 1000;
                    pctPerDay = slope * msPerDay;
                    latest = points[0];
                    resetAt = (_c = (_b = rows[0]) === null || _b === void 0 ? void 0 : _b.resetAt) !== null && _c !== void 0 ? _c : Date.now() + msPerDay;
                    msToReset = resetAt - Date.now();
                    projectedAtReset = latest.y + slope * msToReset;
                    return [2 /*return*/, {
                            pctPerDay: pctPerDay,
                            projectedAtReset: Math.max(0, Math.min(100, projectedAtReset)),
                            sampleCount: n,
                            latestUsagePct: latest.y,
                            resetAt: resetAt,
                        }];
            }
        });
    }); },
});

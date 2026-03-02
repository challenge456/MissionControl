"use strict";
/**
 * Alert Rules — user-defined cost/token thresholds, evaluated by cron.
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateRules = exports.remove = exports.update = exports.create = exports.list = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var ONE_DAY_MS = 24 * 60 * 60 * 1000;
exports.list = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("alertRules")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2: return [4 /*yield*/, ctx.db.query("alertRules").collect()];
                case 3: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.create = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        type: values_1.v.literal("daily_cost_exceeded"),
        threshold: values_1.v.number(),
        enabled: values_1.v.optional(values_1.v.boolean()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var now;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    now = Date.now();
                    return [4 /*yield*/, ctx.db.insert("alertRules", {
                            projectId: args.projectId,
                            type: args.type,
                            threshold: args.threshold,
                            enabled: (_a = args.enabled) !== null && _a !== void 0 ? _a : true,
                            createdAt: now,
                            updatedAt: now,
                        })];
                case 1: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
exports.update = (0, server_1.mutation)({
    args: {
        id: values_1.v.id("alertRules"),
        threshold: values_1.v.optional(values_1.v.number()),
        enabled: values_1.v.optional(values_1.v.boolean()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var id, updates, rule, patch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    id = args.id, updates = __rest(args, ["id"]);
                    return [4 /*yield*/, ctx.db.get(id)];
                case 1:
                    rule = _a.sent();
                    if (!rule)
                        throw new Error("Alert rule not found");
                    patch = {
                        updatedAt: Date.now(),
                    };
                    if (updates.threshold !== undefined)
                        patch.threshold = updates.threshold;
                    if (updates.enabled !== undefined)
                        patch.enabled = updates.enabled;
                    return [4 /*yield*/, ctx.db.patch(id, patch)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, id];
            }
        });
    }); },
});
exports.remove = (0, server_1.mutation)({
    args: { id: values_1.v.id("alertRules") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.delete(args.id)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, args.id];
            }
        });
    }); },
});
/** Internal: run by cron to evaluate rules and create alerts when thresholds are exceeded. */
exports.evaluateRules = (0, server_1.internalMutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var now, since, rules, runs, _loop_1, _i, rules_1, rule;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = Date.now();
                    since = now - ONE_DAY_MS;
                    return [4 /*yield*/, ctx.db
                            .query("alertRules")
                            .withIndex("by_enabled", function (q) { return q.eq("enabled", true); })
                            .collect()];
                case 1:
                    rules = _a.sent();
                    if (rules.length === 0)
                        return [2 /*return*/];
                    return [4 /*yield*/, ctx.db.query("runs").order("desc").take(5000)];
                case 2:
                    runs = _a.sent();
                    runs = runs.filter(function (r) { return r.startedAt >= since; });
                    _loop_1 = function (rule) {
                        var relevant, dailyCost;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    relevant = rule.projectId
                                        ? runs.filter(function (r) { return r.projectId === rule.projectId; })
                                        : runs;
                                    dailyCost = relevant.reduce(function (sum, r) { var _a; return sum + ((_a = r.costUsd) !== null && _a !== void 0 ? _a : 0); }, 0);
                                    if (!(dailyCost >= rule.threshold)) return [3 /*break*/, 2];
                                    return [4 /*yield*/, ctx.db.insert("alerts", {
                                            projectId: rule.projectId,
                                            severity: "WARNING",
                                            type: rule.type,
                                            title: "Alert: ".concat(rule.type.replace(/_/g, " ")),
                                            description: "Daily cost $".concat(dailyCost.toFixed(2), " exceeded threshold $").concat(rule.threshold.toFixed(2), "."),
                                            status: "OPEN",
                                            metadata: { ruleId: rule._id, dailyCost: dailyCost, threshold: rule.threshold },
                                        })];
                                case 1:
                                    _b.sent();
                                    _b.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, rules_1 = rules;
                    _a.label = 3;
                case 3:
                    if (!(_i < rules_1.length)) return [3 /*break*/, 6];
                    rule = rules_1[_i];
                    return [5 /*yield**/, _loop_1(rule)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [2 /*return*/];
            }
        });
    }); },
});

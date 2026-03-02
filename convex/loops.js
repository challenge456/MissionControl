"use strict";
/**
 * Loop Detection — Convex Functions
 *
 * Detects and blocks tasks with loops:
 * - Comment storms (too many messages in short time)
 * - Review ping-pong (too many review cycles)
 * - Repeated tool failures (same tool failing repeatedly)
 * - Back-and-forth transitions (state oscillation)
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
exports.detectLoops = void 0;
var server_1 = require("./_generated/server");
var api_1 = require("./_generated/api");
// ============================================================================
// LOOP DETECTION
// ============================================================================
exports.detectLoops = (0, server_1.internalMutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var policy, thresholds, tasks, checked, blocked, _loop_1, _i, tasks_1, task;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("policies")
                        .withIndex("by_active", function (q) { return q.eq("active", true); })
                        .first()];
                case 1:
                    policy = _e.sent();
                    if (!policy || !policy.loopThresholds) {
                        return [2 /*return*/, { checked: 0, blocked: 0 }];
                    }
                    thresholds = policy.loopThresholds;
                    return [4 /*yield*/, ctx.db
                            .query("tasks")
                            .filter(function (q) {
                            return q.and(q.neq(q.field("status"), "DONE"), q.neq(q.field("status"), "CANCELED"), q.neq(q.field("status"), "FAILED"));
                        })
                            .collect()];
                case 2:
                    tasks = _e.sent();
                    checked = 0;
                    blocked = 0;
                    _loop_1 = function (task) {
                        var windowMs, cutoff_1, recentMessages, backAndForthLimit, bafWindowMinutes, bafCutoff, recentTransitions, statePairs, pairCounts, _f, statePairs_1, pair, maxPairCount_1, offendingPair, runs, recentRuns, failedRuns;
                        return __generator(this, function (_g) {
                            switch (_g.label) {
                                case 0:
                                    checked++;
                                    // Skip if already blocked
                                    if (task.status === "BLOCKED")
                                        return [2 /*return*/, "continue"];
                                    if (!(thresholds.maxCommentsPerWindow && thresholds.windowMinutes)) return [3 /*break*/, 3];
                                    windowMs = thresholds.windowMinutes * 60 * 1000;
                                    cutoff_1 = Date.now() - windowMs;
                                    return [4 /*yield*/, ctx.db
                                            .query("messages")
                                            .withIndex("by_task", function (q) { return q.eq("taskId", task._id); })
                                            .filter(function (q) { return q.gte(q.field("_creationTime"), cutoff_1); })
                                            .collect()];
                                case 1:
                                    recentMessages = _g.sent();
                                    if (!(recentMessages.length > thresholds.maxCommentsPerWindow)) return [3 /*break*/, 3];
                                    return [4 /*yield*/, blockTaskForLoop(ctx, task, {
                                            type: "COMMENT_STORM",
                                            count: recentMessages.length,
                                            threshold: thresholds.maxCommentsPerWindow,
                                            window: thresholds.windowMinutes,
                                        })];
                                case 2:
                                    _g.sent();
                                    blocked++;
                                    return [2 /*return*/, "continue"];
                                case 3:
                                    if (!(thresholds.maxReviewCycles && task.reviewCycles > thresholds.maxReviewCycles)) return [3 /*break*/, 5];
                                    return [4 /*yield*/, blockTaskForLoop(ctx, task, {
                                            type: "REVIEW_PING_PONG",
                                            count: task.reviewCycles,
                                            threshold: thresholds.maxReviewCycles,
                                        })];
                                case 4:
                                    _g.sent();
                                    blocked++;
                                    return [2 /*return*/, "continue"];
                                case 5:
                                    backAndForthLimit = (_a = thresholds.backAndForthLimit) !== null && _a !== void 0 ? _a : 6;
                                    bafWindowMinutes = (_b = thresholds.backAndForthWindowMinutes) !== null && _b !== void 0 ? _b : 60;
                                    bafCutoff = Date.now() - (bafWindowMinutes * 60 * 1000);
                                    return [4 /*yield*/, ctx.db
                                            .query("taskTransitions")
                                            .withIndex("by_task", function (q) { return q.eq("taskId", task._id); })
                                            .filter(function (q) { return q.gte(q.field("_creationTime"), bafCutoff); })
                                            .collect()];
                                case 6:
                                    recentTransitions = _g.sent();
                                    if (!(recentTransitions.length >= backAndForthLimit)) return [3 /*break*/, 8];
                                    statePairs = recentTransitions.map(function (t) { return "".concat(t.fromStatus, "->").concat(t.toStatus); });
                                    pairCounts = {};
                                    for (_f = 0, statePairs_1 = statePairs; _f < statePairs_1.length; _f++) {
                                        pair = statePairs_1[_f];
                                        pairCounts[pair] = (pairCounts[pair] || 0) + 1;
                                    }
                                    maxPairCount_1 = Math.max.apply(Math, Object.values(pairCounts));
                                    if (!(maxPairCount_1 >= Math.ceil(backAndForthLimit / 2))) return [3 /*break*/, 8];
                                    offendingPair = (_d = (_c = Object.entries(pairCounts)
                                        .find(function (_a) {
                                        var count = _a[1];
                                        return count === maxPairCount_1;
                                    })) === null || _c === void 0 ? void 0 : _c[0]) !== null && _d !== void 0 ? _d : "unknown";
                                    return [4 /*yield*/, blockTaskForLoop(ctx, task, {
                                            type: "BACK_AND_FORTH",
                                            count: recentTransitions.length,
                                            threshold: backAndForthLimit,
                                            window: bafWindowMinutes,
                                            detail: "Oscillation detected: \"".concat(offendingPair, "\" occurred ").concat(maxPairCount_1, " times"),
                                        })];
                                case 7:
                                    _g.sent();
                                    blocked++;
                                    return [2 /*return*/, "continue"];
                                case 8: return [4 /*yield*/, ctx.db
                                        .query("runs")
                                        .withIndex("by_task", function (q) { return q.eq("taskId", task._id); })
                                        .collect()];
                                case 9:
                                    runs = _g.sent();
                                    recentRuns = runs.slice(-10);
                                    failedRuns = recentRuns.filter(function (r) { return r.status === "FAILED"; });
                                    if (!(failedRuns.length >= 5)) return [3 /*break*/, 11];
                                    return [4 /*yield*/, blockTaskForLoop(ctx, task, {
                                            type: "REPEATED_FAILURES",
                                            count: failedRuns.length,
                                            threshold: 5,
                                        })];
                                case 10:
                                    _g.sent();
                                    blocked++;
                                    return [2 /*return*/, "continue"];
                                case 11: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, tasks_1 = tasks;
                    _e.label = 3;
                case 3:
                    if (!(_i < tasks_1.length)) return [3 /*break*/, 6];
                    task = tasks_1[_i];
                    return [5 /*yield**/, _loop_1(task)];
                case 4:
                    _e.sent();
                    _e.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [2 /*return*/, { checked: checked, blocked: blocked }];
            }
        });
    }); },
});
// ============================================================================
// HELPERS
// ============================================================================
function blockTaskForLoop(ctx, task, loopData) {
    return __awaiter(this, void 0, void 0, function () {
        var firstAssignee;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: 
                // Move task to BLOCKED
                return [4 /*yield*/, ctx.db.patch(task._id, {
                        status: "BLOCKED",
                        blockedReason: "Loop detected: ".concat(loopData.type, " (").concat(loopData.count, " > ").concat(loopData.threshold, ")").concat(loopData.detail ? " \u2014 ".concat(loopData.detail) : ""),
                    })];
                case 1:
                    // Move task to BLOCKED
                    _b.sent();
                    // Create transition record
                    return [4 /*yield*/, ctx.db.insert("taskTransitions", {
                            projectId: task.projectId,
                            idempotencyKey: "loop:".concat(task._id, ":").concat(Date.now()),
                            taskId: task._id,
                            fromStatus: task.status,
                            toStatus: "BLOCKED",
                            actorType: "SYSTEM",
                            reason: "Loop detected: ".concat(loopData.type),
                        })];
                case 2:
                    // Create transition record
                    _b.sent();
                    // Create alert
                    return [4 /*yield*/, ctx.db.insert("alerts", {
                            projectId: task.projectId,
                            severity: "WARNING",
                            type: "LOOP_DETECTED",
                            title: "Loop detected: ".concat(loopData.type),
                            description: "Task \"".concat(task.title, "\" blocked due to ").concat(loopData.type, ": ").concat(loopData.count, " occurrences (threshold: ").concat(loopData.threshold, ")").concat(loopData.detail ? " \u2014 ".concat(loopData.detail) : ""),
                            taskId: task._id,
                            status: "OPEN",
                            metadata: { loopData: loopData },
                        })];
                case 3:
                    // Create alert
                    _b.sent();
                    firstAssignee = (_a = task.assigneeIds) === null || _a === void 0 ? void 0 : _a[0];
                    if (!firstAssignee) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.db.insert("agentDocuments", {
                            projectId: task.projectId,
                            agentId: firstAssignee,
                            type: "SESSION_MEMORY",
                            content: "# Loop Detected: ".concat(task.title, "\n\n") +
                                "**Type:** ".concat(loopData.type, "\n") +
                                "**Count:** ".concat(loopData.count, "\n") +
                                "**Threshold:** ".concat(loopData.threshold, "\n") +
                                (loopData.window ? "**Window:** ".concat(loopData.window, " minutes\n") : "") +
                                (loopData.detail ? "**Detail:** ".concat(loopData.detail, "\n") : "") +
                                "\n**Action:** Task blocked. Review and resolve the loop before unblocking.",
                            updatedAt: Date.now(),
                            metadata: { loopDetection: loopData },
                        })];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5: 
                // Send notification via telegram (stored for polling)
                return [4 /*yield*/, ctx.runMutation(api_1.internal.telegram.notifyLoopDetected, {
                        taskId: task._id,
                        loopType: loopData.type,
                        count: loopData.count,
                        threshold: loopData.threshold,
                    })];
                case 6:
                    // Send notification via telegram (stored for polling)
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}

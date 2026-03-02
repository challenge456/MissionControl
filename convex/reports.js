"use strict";
/**
 * Incident Report Export
 *
 * Generate markdown reports for tasks
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
exports.generateIncidentReport = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
exports.generateIncidentReport = (0, server_1.query)({
    args: { taskId: values_1.v.id("tasks") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var task, transitions, messages, approvals, runs, totalCost, report, _i, transitions_1, t, _a, _b, m, _c, approvals_1, a, _d, runs_1, r;
        var _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1:
                    task = _g.sent();
                    if (!task) {
                        throw new Error("Task not found");
                    }
                    return [4 /*yield*/, ctx.db
                            .query("taskTransitions")
                            .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                            .collect()];
                case 2:
                    transitions = _g.sent();
                    return [4 /*yield*/, ctx.db
                            .query("messages")
                            .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                            .collect()];
                case 3:
                    messages = _g.sent();
                    return [4 /*yield*/, ctx.db
                            .query("approvals")
                            .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                            .collect()];
                case 4:
                    approvals = _g.sent();
                    return [4 /*yield*/, ctx.db
                            .query("runs")
                            .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                            .collect()];
                case 5:
                    runs = _g.sent();
                    totalCost = runs.reduce(function (sum, r) { return sum + (r.costUsd || 0); }, 0);
                    report = "# Incident Report: ".concat(task.title, "\n\n");
                    report += "**Task ID:** ".concat(task._id, "\n");
                    report += "**Status:** ".concat(task.status, "\n");
                    report += "**Type:** ".concat(task.type, "\n");
                    report += "**Priority:** ".concat(task.priority, "\n");
                    report += "**Created:** ".concat(new Date(task._creationTime).toISOString(), "\n");
                    report += "**Total Cost:** $".concat(totalCost.toFixed(2), "\n\n");
                    if (task.description) {
                        report += "## Description\n\n".concat(task.description, "\n\n");
                    }
                    report += "## Timeline\n\n";
                    for (_i = 0, transitions_1 = transitions; _i < transitions_1.length; _i++) {
                        t = transitions_1[_i];
                        report += "- ".concat(new Date(t._creationTime).toISOString(), " - ").concat(t.fromStatus, " \u2192 ").concat(t.toStatus, "\n");
                        if (t.reason)
                            report += "  *".concat(t.reason, "*\n");
                    }
                    report += "\n## Messages (".concat(messages.length, ")\n\n");
                    for (_a = 0, _b = messages.slice(0, 10); _a < _b.length; _a++) {
                        m = _b[_a];
                        report += "### ".concat(new Date(m._creationTime).toISOString(), "\n");
                        report += "**Type:** ".concat(m.type, "\n");
                        report += "".concat(m.content, "\n\n");
                    }
                    if (messages.length > 10) {
                        report += "*... and ".concat(messages.length - 10, " more messages*\n\n");
                    }
                    report += "\n## Approvals (".concat(approvals.length, ")\n\n");
                    for (_c = 0, approvals_1 = approvals; _c < approvals_1.length; _c++) {
                        a = approvals_1[_c];
                        report += "- **".concat(a.actionSummary, "** - ").concat(a.status, "\n");
                        report += "  Risk: ".concat(a.riskLevel, ", Cost: $").concat(((_e = a.estimatedCost) === null || _e === void 0 ? void 0 : _e.toFixed(2)) || 0, "\n");
                        if (a.justification) {
                            report += "  Justification: ".concat(a.justification, "\n");
                        }
                    }
                    report += "\n## Execution Runs (".concat(runs.length, ")\n\n");
                    for (_d = 0, runs_1 = runs; _d < runs_1.length; _d++) {
                        r = runs_1[_d];
                        report += "- ".concat(r.status, " - Cost: $").concat(((_f = r.costUsd) === null || _f === void 0 ? void 0 : _f.toFixed(2)) || 0, "\n");
                        if (r.error) {
                            report += "  Error: ".concat(r.error, "\n");
                        }
                    }
                    report += "\n---\n\n";
                    report += "*Generated by Mission Control on ".concat(new Date().toISOString(), "*\n");
                    return [2 /*return*/, { report: report, task: task, totalCost: totalCost }];
            }
        });
    }); },
});

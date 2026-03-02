"use strict";
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
exports.storeResult = exports.executeHybrid = exports.executeUi = exports.executeApi = exports.get = exports.list = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
// Extension point: executeApi / executeUi / executeHybrid currently simulate steps.
// To wire real runners (e.g. Playwright, API client), replace evaluateSteps with
// adapter calls that return the same shape (evaluated steps, passed/failed counts, totalTime).
function buildResultId() {
    return "exec_".concat(Math.random().toString(36).slice(2, 10));
}
function evaluateSteps(steps) {
    var startedAt = Date.now();
    var evaluated = steps.map(function (step, index) { return ({
        step: step.name,
        status: step.shouldFail ? "failed" : "passed",
        responseTimeMs: 60 + index * 20,
        error: step.shouldFail ? "Simulated failure" : undefined,
    }); });
    var passed = evaluated.filter(function (s) { return s.status === "passed"; }).length;
    var failed = evaluated.length - passed;
    return {
        evaluated: evaluated,
        passed: passed,
        failed: failed,
        success: failed === 0,
        totalTime: Date.now() - startedAt + evaluated.length * 10,
    };
}
exports.list = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        executionType: values_1.v.optional(values_1.v.union(values_1.v.literal("api"), values_1.v.literal("ui"), values_1.v.literal("hybrid"))),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var rows, _a;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db.query("executionResults").withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); }).order("desc").take((_b = args.limit) !== null && _b !== void 0 ? _b : 50)];
                case 1:
                    _a = _d.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("executionResults").order("desc").take((_c = args.limit) !== null && _c !== void 0 ? _c : 50)];
                case 3:
                    _a = _d.sent();
                    _d.label = 4;
                case 4:
                    rows = _a;
                    return [2 /*return*/, args.executionType ? rows.filter(function (row) { return row.executionType === args.executionType; }) : rows];
            }
        });
    }); },
});
exports.get = (0, server_1.query)({
    args: { id: values_1.v.id("executionResults") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, ctx.db.get(args.id)];
            case 1: return [2 /*return*/, _a.sent()];
        }
    }); }); },
});
exports.executeApi = (0, server_1.action)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        executedBy: values_1.v.optional(values_1.v.string()),
        steps: values_1.v.array(values_1.v.object({ name: values_1.v.string(), shouldFail: values_1.v.optional(values_1.v.boolean()) })),
    },
    handler: function (_ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            result = evaluateSteps(args.steps.map(function (step) { return ({ name: step.name, shouldFail: step.shouldFail }); }));
            return [2 /*return*/, __assign({}, result)];
        });
    }); },
});
exports.executeUi = (0, server_1.action)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        executedBy: values_1.v.optional(values_1.v.string()),
        commands: values_1.v.array(values_1.v.string()),
    },
    handler: function (_ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var steps;
        return __generator(this, function (_a) {
            steps = args.commands.map(function (command) { return ({ step: command, status: "passed", responseTimeMs: 80 }); });
            return [2 /*return*/, {
                    success: true,
                    passed: steps.length,
                    failed: 0,
                    totalTime: steps.length * 80,
                    steps: steps,
                }];
        });
    }); },
});
exports.executeHybrid = (0, server_1.action)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        executedBy: values_1.v.optional(values_1.v.string()),
        apiSteps: values_1.v.array(values_1.v.object({ name: values_1.v.string(), shouldFail: values_1.v.optional(values_1.v.boolean()) })),
        uiCommands: values_1.v.array(values_1.v.string()),
    },
    handler: function (_ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var api, uiPassed, failed;
        return __generator(this, function (_a) {
            api = evaluateSteps(args.apiSteps);
            uiPassed = args.uiCommands.length;
            failed = api.failed;
            return [2 /*return*/, {
                    success: failed === 0,
                    passed: api.passed + uiPassed,
                    failed: failed,
                    totalTime: api.totalTime + uiPassed * 75,
                    context: { apiContextReady: api.success },
                    steps: __spreadArray(__spreadArray([], api.evaluated, true), args.uiCommands.map(function (command) { return ({ step: command, status: "passed", responseTimeMs: 75 }); }), true),
                }];
        });
    }); },
});
exports.storeResult = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        executionType: values_1.v.union(values_1.v.literal("api"), values_1.v.literal("ui"), values_1.v.literal("hybrid")),
        suiteId: values_1.v.optional(values_1.v.id("testSuites")),
        workflowId: values_1.v.optional(values_1.v.id("hybridWorkflows")),
        jobId: values_1.v.optional(values_1.v.id("scheduledJobs")),
        steps: values_1.v.array(values_1.v.any()),
        totalTime: values_1.v.number(),
        passed: values_1.v.number(),
        failed: values_1.v.number(),
        success: values_1.v.boolean(),
        context: values_1.v.optional(values_1.v.any()),
        executedBy: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var resultId, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    resultId = buildResultId();
                    return [4 /*yield*/, ctx.db.insert("executionResults", {
                            tenantId: undefined,
                            projectId: args.projectId,
                            resultId: resultId,
                            executionType: args.executionType,
                            suiteId: args.suiteId,
                            workflowId: args.workflowId,
                            jobId: args.jobId,
                            steps: args.steps,
                            totalTime: args.totalTime,
                            passed: args.passed,
                            failed: args.failed,
                            success: args.success,
                            context: args.context,
                            executedAt: Date.now(),
                            executedBy: args.executedBy,
                        })];
                case 1:
                    id = _a.sent();
                    return [2 /*return*/, { id: id, resultId: resultId }];
            }
        });
    }); },
});

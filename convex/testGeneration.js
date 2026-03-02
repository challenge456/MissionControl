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
exports.execute = exports.generate = exports.create = exports.get = exports.list = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var api_1 = require("./_generated/api");
function buildSuiteId() {
    return "suite_".concat(Math.random().toString(36).slice(2, 10));
}
function generateApiSteps(sourceData) {
    var endpoints = Array.isArray(sourceData.endpoints) ? sourceData.endpoints : [];
    return endpoints.map(function (endpoint, idx) {
        var _a, _b;
        return ({
            title: "API Step ".concat(idx + 1),
            method: (_a = endpoint.method) !== null && _a !== void 0 ? _a : "GET",
            url: (_b = endpoint.url) !== null && _b !== void 0 ? _b : "/",
            headers: {},
            asserts: [{ type: "status", expected: 200 }],
        });
    });
}
function generateUiSteps(sourceData) {
    var interactions = Array.isArray(sourceData.interactions) ? sourceData.interactions : [];
    return interactions.map(function (entry) { var _a; return "await page.".concat(String((_a = entry.action) !== null && _a !== void 0 ? _a : "waitForTimeout"), "(100);"); });
}
exports.list = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        testType: values_1.v.optional(values_1.v.string()),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var suites, _a;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db.query("testSuites").withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); }).order("desc").take((_b = args.limit) !== null && _b !== void 0 ? _b : 100)];
                case 1:
                    _a = _d.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("testSuites").order("desc").take((_c = args.limit) !== null && _c !== void 0 ? _c : 100)];
                case 3:
                    _a = _d.sent();
                    _d.label = 4;
                case 4:
                    suites = _a;
                    return [2 /*return*/, args.testType ? suites.filter(function (suite) { return suite.testType === args.testType; }) : suites];
            }
        });
    }); },
});
exports.get = (0, server_1.query)({
    args: { id: values_1.v.id("testSuites") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, ctx.db.get(args.id)];
            case 1: return [2 /*return*/, _a.sent()];
        }
    }); }); },
});
exports.create = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        createdBy: values_1.v.optional(values_1.v.string()),
        name: values_1.v.string(),
        description: values_1.v.optional(values_1.v.string()),
        testType: values_1.v.union(values_1.v.literal("api_functional"), values_1.v.literal("api_integration"), values_1.v.literal("ui_functional"), values_1.v.literal("ui_e2e"), values_1.v.literal("hybrid_workflow"), values_1.v.literal("performance"), values_1.v.literal("security")),
        apiTests: values_1.v.optional(values_1.v.array(values_1.v.any())),
        uiTests: values_1.v.optional(values_1.v.array(values_1.v.string())),
        gherkinFeature: values_1.v.optional(values_1.v.string()),
        tags: values_1.v.optional(values_1.v.array(values_1.v.string())),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var suiteId, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    suiteId = buildSuiteId();
                    return [4 /*yield*/, ctx.db.insert("testSuites", {
                            tenantId: undefined,
                            projectId: args.projectId,
                            suiteId: suiteId,
                            name: args.name,
                            description: args.description,
                            testType: args.testType,
                            apiTests: args.apiTests,
                            uiTests: args.uiTests,
                            gherkinFeature: args.gherkinFeature,
                            executionMode: args.testType.includes("api")
                                ? "api_only"
                                : args.testType.includes("ui")
                                    ? "ui_only"
                                    : "hybrid",
                            retryEnabled: true,
                            timeoutSeconds: 300,
                            tags: args.tags,
                            createdBy: args.createdBy,
                            status: "READY",
                        })];
                case 1:
                    id = _a.sent();
                    return [2 /*return*/, { id: id, suiteId: suiteId }];
            }
        });
    }); },
});
exports.generate = (0, server_1.action)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        createdBy: values_1.v.optional(values_1.v.string()),
        testType: values_1.v.union(values_1.v.literal("api_functional"), values_1.v.literal("api_integration"), values_1.v.literal("ui_functional"), values_1.v.literal("ui_e2e"), values_1.v.literal("hybrid_workflow"), values_1.v.literal("performance"), values_1.v.literal("security")),
        sourceData: values_1.v.any(),
        suiteName: values_1.v.optional(values_1.v.string()),
        autoExecute: values_1.v.optional(values_1.v.boolean()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var sourceData, apiTests, uiTests, gherkin, created, executionResult;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    sourceData = ((_a = args.sourceData) !== null && _a !== void 0 ? _a : {});
                    apiTests = generateApiSteps(sourceData);
                    uiTests = generateUiSteps(sourceData);
                    gherkin = "Feature: ".concat((_b = args.suiteName) !== null && _b !== void 0 ? _b : "Generated test suite", "\n  Scenario: Auto-generated");
                    return [4 /*yield*/, ctx.runMutation(api_1.api.testGeneration.create, {
                            projectId: args.projectId,
                            createdBy: args.createdBy,
                            name: (_c = args.suiteName) !== null && _c !== void 0 ? _c : "Generated Test Suite",
                            description: "Automatically generated from source payload",
                            testType: args.testType,
                            apiTests: apiTests,
                            uiTests: uiTests,
                            gherkinFeature: gherkin,
                            tags: ["generated"],
                        })];
                case 1:
                    created = _d.sent();
                    if (!args.autoExecute) return [3 /*break*/, 7];
                    if (!(args.testType === "hybrid_workflow")) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.runAction(api_1.api.execution.executeHybrid, {
                            projectId: args.projectId,
                            executedBy: args.createdBy,
                            apiSteps: apiTests.map(function (step, index) { var _a; return ({ name: String((_a = step.title) !== null && _a !== void 0 ? _a : "step-".concat(index + 1)) }); }),
                            uiCommands: uiTests,
                        })];
                case 2:
                    executionResult = _d.sent();
                    return [3 /*break*/, 7];
                case 3:
                    if (!args.testType.includes("api")) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.runAction(api_1.api.execution.executeApi, {
                            projectId: args.projectId,
                            executedBy: args.createdBy,
                            steps: apiTests.map(function (step, index) { var _a; return ({ name: String((_a = step.title) !== null && _a !== void 0 ? _a : "step-".concat(index + 1)) }); }),
                        })];
                case 4:
                    executionResult = _d.sent();
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, ctx.runAction(api_1.api.execution.executeUi, {
                        projectId: args.projectId,
                        executedBy: args.createdBy,
                        commands: uiTests,
                    })];
                case 6:
                    executionResult = _d.sent();
                    _d.label = 7;
                case 7: return [2 /*return*/, {
                        suiteId: created.suiteId,
                        id: created.id,
                        testType: args.testType,
                        generated: {
                            apiTests: apiTests.length,
                            uiTests: uiTests.length,
                        },
                        executionResult: executionResult,
                    }];
            }
        });
    }); },
});
exports.execute = (0, server_1.action)({
    args: {
        id: values_1.v.id("testSuites"),
        executedBy: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var suite, executionResult;
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0: return [4 /*yield*/, ctx.runQuery(api_1.api.testGeneration.get, { id: args.id })];
                case 1:
                    suite = _j.sent();
                    if (!suite)
                        throw new Error("Test suite not found");
                    if (!(suite.testType === "hybrid_workflow")) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.runAction(api_1.api.execution.executeHybrid, {
                            projectId: suite.projectId,
                            executedBy: args.executedBy,
                            apiSteps: ((_a = suite.apiTests) !== null && _a !== void 0 ? _a : []).map(function (step, index) { var _a; return ({ name: String((_a = step.title) !== null && _a !== void 0 ? _a : "step-".concat(index + 1)) }); }),
                            uiCommands: (_b = suite.uiTests) !== null && _b !== void 0 ? _b : [],
                        })];
                case 2:
                    executionResult = _j.sent();
                    return [3 /*break*/, 7];
                case 3:
                    if (!suite.testType.includes("api")) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.runAction(api_1.api.execution.executeApi, {
                            projectId: suite.projectId,
                            executedBy: args.executedBy,
                            steps: ((_c = suite.apiTests) !== null && _c !== void 0 ? _c : []).map(function (step, index) { var _a; return ({ name: String((_a = step.title) !== null && _a !== void 0 ? _a : "step-".concat(index + 1)) }); }),
                        })];
                case 4:
                    executionResult = _j.sent();
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, ctx.runAction(api_1.api.execution.executeUi, {
                        projectId: suite.projectId,
                        executedBy: args.executedBy,
                        commands: (_d = suite.uiTests) !== null && _d !== void 0 ? _d : [],
                    })];
                case 6:
                    executionResult = _j.sent();
                    _j.label = 7;
                case 7: return [4 /*yield*/, ctx.runMutation(api_1.api.execution.storeResult, {
                        projectId: suite.projectId,
                        executionType: suite.executionMode === "hybrid" ? "hybrid" : suite.executionMode === "api_only" ? "api" : "ui",
                        suiteId: args.id,
                        steps: (_e = executionResult.steps) !== null && _e !== void 0 ? _e : [],
                        totalTime: Number((_f = executionResult.totalTime) !== null && _f !== void 0 ? _f : 0),
                        passed: Number((_g = executionResult.passed) !== null && _g !== void 0 ? _g : 0),
                        failed: Number((_h = executionResult.failed) !== null && _h !== void 0 ? _h : 0),
                        success: Boolean(executionResult.success),
                        context: executionResult.context,
                        executedBy: args.executedBy,
                    })];
                case 8:
                    _j.sent();
                    return [2 /*return*/, executionResult];
            }
        });
    }); },
});

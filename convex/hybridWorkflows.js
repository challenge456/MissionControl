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
exports.execute = exports.create = exports.getResults = exports.get = exports.list = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var api_1 = require("./_generated/api");
function buildWorkflowId() {
    return "hyb_".concat(Math.random().toString(36).slice(2, 10));
}
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
                    return [4 /*yield*/, ctx.db.query("hybridWorkflows").withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); }).order("desc").take((_b = args.limit) !== null && _b !== void 0 ? _b : 50)];
                case 1:
                    _a = _d.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("hybridWorkflows").order("desc").take((_c = args.limit) !== null && _c !== void 0 ? _c : 50)];
                case 3:
                    _a = _d.sent();
                    _d.label = 4;
                case 4:
                    rows = _a;
                    return [2 /*return*/, args.activeOnly ? rows.filter(function (row) { return row.active; }) : rows];
            }
        });
    }); },
});
exports.get = (0, server_1.query)({
    args: { id: values_1.v.id("hybridWorkflows") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, ctx.db.get(args.id)];
            case 1: return [2 /*return*/, _a.sent()];
        }
    }); }); },
});
exports.getResults = (0, server_1.query)({
    args: { id: values_1.v.id("hybridWorkflows"), limit: values_1.v.optional(values_1.v.number()) },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var rows;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("executionResults")
                        .withIndex("by_type", function (q) { return q.eq("executionType", "hybrid"); })
                        .order("desc")
                        .take((_a = args.limit) !== null && _a !== void 0 ? _a : 20)];
                case 1:
                    rows = _b.sent();
                    return [2 /*return*/, rows.filter(function (row) { return row.workflowId === args.id; })];
            }
        });
    }); },
});
exports.create = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        name: values_1.v.string(),
        description: values_1.v.optional(values_1.v.string()),
        apiSetupSteps: values_1.v.array(values_1.v.any()),
        uiValidationSteps: values_1.v.array(values_1.v.string()),
        executionMode: values_1.v.union(values_1.v.literal("api_only"), values_1.v.literal("ui_only"), values_1.v.literal("hybrid"), values_1.v.literal("auto_detect")),
        stopOnFailure: values_1.v.optional(values_1.v.boolean()),
        timeoutSeconds: values_1.v.optional(values_1.v.number()),
        retryEnabled: values_1.v.optional(values_1.v.boolean()),
        createdBy: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var workflowId, id;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    workflowId = buildWorkflowId();
                    return [4 /*yield*/, ctx.db.insert("hybridWorkflows", {
                            tenantId: undefined,
                            projectId: args.projectId,
                            workflowId: workflowId,
                            name: args.name,
                            description: args.description,
                            apiSetupSteps: args.apiSetupSteps,
                            uiValidationSteps: args.uiValidationSteps,
                            executionMode: args.executionMode,
                            stopOnFailure: (_a = args.stopOnFailure) !== null && _a !== void 0 ? _a : false,
                            timeoutSeconds: (_b = args.timeoutSeconds) !== null && _b !== void 0 ? _b : 300,
                            retryEnabled: (_c = args.retryEnabled) !== null && _c !== void 0 ? _c : true,
                            createdBy: args.createdBy,
                            active: true,
                        })];
                case 1:
                    id = _d.sent();
                    return [2 /*return*/, { id: id, workflowId: workflowId }];
            }
        });
    }); },
});
exports.execute = (0, server_1.action)({
    args: {
        id: values_1.v.id("hybridWorkflows"),
        executedBy: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var workflow, apiSteps, execution;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, ctx.runQuery(api_1.api.hybridWorkflows.get, { id: args.id })];
                case 1:
                    workflow = _e.sent();
                    if (!workflow)
                        throw new Error("Hybrid workflow not found");
                    apiSteps = workflow.apiSetupSteps.map(function (step, index) {
                        var _a;
                        return ({
                            name: String((_a = step.title) !== null && _a !== void 0 ? _a : "api-step-".concat(index + 1)),
                        });
                    });
                    return [4 /*yield*/, ctx.runAction(api_1.api.execution.executeHybrid, {
                            projectId: workflow.projectId,
                            executedBy: args.executedBy,
                            apiSteps: apiSteps,
                            uiCommands: workflow.uiValidationSteps,
                        })];
                case 2:
                    execution = _e.sent();
                    return [4 /*yield*/, ctx.runMutation(api_1.api.execution.storeResult, {
                            projectId: workflow.projectId,
                            executionType: "hybrid",
                            workflowId: args.id,
                            steps: (_a = execution.steps) !== null && _a !== void 0 ? _a : [],
                            totalTime: Number((_b = execution.totalTime) !== null && _b !== void 0 ? _b : 0),
                            passed: Number((_c = execution.passed) !== null && _c !== void 0 ? _c : 0),
                            failed: Number((_d = execution.failed) !== null && _d !== void 0 ? _d : 0),
                            success: Boolean(execution.success),
                            context: execution.context,
                            executedBy: args.executedBy,
                        })];
                case 3:
                    _e.sent();
                    return [2 /*return*/, execution];
            }
        });
    }); },
});

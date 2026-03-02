"use strict";
/**
 * Workflows — Convex Functions
 *
 * Multi-agent workflow definitions and execution.
 * Inspired by Antfarm's deterministic workflow patterns.
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
exports.install = exports.remove = exports.setActive = exports.upsert = exports.getById = exports.get = exports.list = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
// ============================================================================
// QUERIES
// ============================================================================
/**
 * List all workflows
 */
exports.list = (0, server_1.query)({
    args: {
        activeOnly: values_1.v.optional(values_1.v.boolean()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.activeOnly) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("workflows")
                            .withIndex("by_active", function (q) { return q.eq("active", true); })
                            .collect()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2: return [4 /*yield*/, ctx.db.query("workflows").collect()];
                case 3: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/**
 * Get a workflow by ID
 */
exports.get = (0, server_1.query)({
    args: { workflowId: values_1.v.string() },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("workflows")
                        .withIndex("by_workflow_id", function (q) { return q.eq("workflowId", args.workflowId); })
                        .first()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/**
 * Get workflow by Convex _id
 */
exports.getById = (0, server_1.query)({
    args: { id: values_1.v.id("workflows") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.id)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
/**
 * Create or update a workflow definition
 */
exports.upsert = (0, server_1.mutation)({
    args: {
        workflowId: values_1.v.string(),
        name: values_1.v.string(),
        description: values_1.v.string(),
        agents: values_1.v.array(values_1.v.object({
            id: values_1.v.string(),
            persona: values_1.v.string(),
            workspace: values_1.v.optional(values_1.v.object({
                files: values_1.v.optional(values_1.v.any()),
            })),
        })),
        steps: values_1.v.array(values_1.v.object({
            id: values_1.v.string(),
            agent: values_1.v.string(),
            input: values_1.v.string(),
            expects: values_1.v.string(),
            retryLimit: values_1.v.number(),
            timeoutMinutes: values_1.v.number(),
        })),
        active: values_1.v.optional(values_1.v.boolean()),
        createdBy: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var existing, now;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("workflows")
                        .withIndex("by_workflow_id", function (q) { return q.eq("workflowId", args.workflowId); })
                        .first()];
                case 1:
                    existing = _c.sent();
                    now = Date.now();
                    if (!existing) return [3 /*break*/, 3];
                    // Update existing workflow
                    return [4 /*yield*/, ctx.db.patch(existing._id, {
                            name: args.name,
                            description: args.description,
                            agents: args.agents,
                            steps: args.steps,
                            active: (_a = args.active) !== null && _a !== void 0 ? _a : existing.active,
                            version: existing.version + 1,
                            updatedAt: now,
                        })];
                case 2:
                    // Update existing workflow
                    _c.sent();
                    return [2 /*return*/, existing._id];
                case 3: return [4 /*yield*/, ctx.db.insert("workflows", {
                        workflowId: args.workflowId,
                        name: args.name,
                        description: args.description,
                        agents: args.agents,
                        steps: args.steps,
                        active: (_b = args.active) !== null && _b !== void 0 ? _b : true,
                        version: 1,
                        createdBy: args.createdBy,
                        createdAt: now,
                        updatedAt: now,
                    })];
                case 4: 
                // Create new workflow
                return [2 /*return*/, _c.sent()];
            }
        });
    }); },
});
/**
 * Activate or deactivate a workflow
 */
exports.setActive = (0, server_1.mutation)({
    args: {
        workflowId: values_1.v.string(),
        active: values_1.v.boolean(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var workflow;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("workflows")
                        .withIndex("by_workflow_id", function (q) { return q.eq("workflowId", args.workflowId); })
                        .first()];
                case 1:
                    workflow = _a.sent();
                    if (!workflow) {
                        throw new Error("Workflow not found: ".concat(args.workflowId));
                    }
                    return [4 /*yield*/, ctx.db.patch(workflow._id, {
                            active: args.active,
                            updatedAt: Date.now(),
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, workflow._id];
            }
        });
    }); },
});
/**
 * Delete a workflow
 */
exports.remove = (0, server_1.mutation)({
    args: { workflowId: values_1.v.string() },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var workflow, activeRuns;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("workflows")
                        .withIndex("by_workflow_id", function (q) { return q.eq("workflowId", args.workflowId); })
                        .first()];
                case 1:
                    workflow = _a.sent();
                    if (!workflow) {
                        throw new Error("Workflow not found: ".concat(args.workflowId));
                    }
                    return [4 /*yield*/, ctx.db
                            .query("workflowRuns")
                            .withIndex("by_workflow_id", function (q) { return q.eq("workflowId", args.workflowId); })
                            .filter(function (q) { return q.or(q.eq(q.field("status"), "RUNNING"), q.eq(q.field("status"), "PENDING")); })
                            .collect()];
                case 2:
                    activeRuns = _a.sent();
                    if (activeRuns.length > 0) {
                        throw new Error("Cannot delete workflow with ".concat(activeRuns.length, " active runs"));
                    }
                    return [4 /*yield*/, ctx.db.delete(workflow._id)];
                case 3:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
// ============================================================================
// ACTIONS
// ============================================================================
/**
 * Install a workflow from YAML definition
 * (In production, this would parse YAML files from workflows/ directory)
 */
exports.install = (0, server_1.action)({
    args: {
        workflowId: values_1.v.string(),
        yamlContent: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // For now, this is a placeholder
            // In full implementation, this would:
            // 1. Parse YAML from workflows/${workflowId}.yaml
            // 2. Validate the workflow definition
            // 3. Call upsert mutation
            throw new Error("install action not yet implemented - use upsert mutation directly");
        });
    }); },
});

"use strict";
/**
 * QC Rulesets — Convex Functions
 *
 * Configurable quality check definitions and built-in presets.
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
exports.seedDefaults = exports.remove = exports.update = exports.create = exports.get = exports.list = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
// ============================================================================
// QUERIES
// ============================================================================
/**
 * List rulesets
 */
exports.list = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        active: values_1.v.optional(values_1.v.boolean()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(args.projectId && args.active !== undefined)) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("qcRulesets")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .filter(function (q) { return q.eq(q.field("active"), args.active); })
                            .collect()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    if (!args.projectId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db
                            .query("qcRulesets")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 3: return [2 /*return*/, _a.sent()];
                case 4:
                    if (!(args.active !== undefined)) return [3 /*break*/, 6];
                    return [4 /*yield*/, ctx.db
                            .query("qcRulesets")
                            .withIndex("by_active", function (q) { return q.eq("active", args.active); })
                            .collect()];
                case 5: return [2 /*return*/, _a.sent()];
                case 6: return [4 /*yield*/, ctx.db.query("qcRulesets").collect()];
                case 7: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/**
 * Get a single ruleset
 */
exports.get = (0, server_1.query)({
    args: { id: values_1.v.id("qcRulesets") },
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
 * Create a ruleset
 */
exports.create = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        name: values_1.v.string(),
        description: values_1.v.optional(values_1.v.string()),
        preset: values_1.v.optional(values_1.v.union(values_1.v.literal("PRE_RELEASE"), values_1.v.literal("POST_MERGE"), values_1.v.literal("WEEKLY_HEALTH"), values_1.v.literal("SECURITY_FOCUS"), values_1.v.literal("CUSTOM"))),
        requiredDocs: values_1.v.array(values_1.v.string()),
        coverageThresholds: values_1.v.object({
            unit: values_1.v.number(),
            integration: values_1.v.number(),
            e2e: values_1.v.number(),
        }),
        securityPaths: values_1.v.array(values_1.v.string()),
        gateDefinitions: values_1.v.array(values_1.v.object({
            name: values_1.v.string(),
            condition: values_1.v.string(),
            severity: values_1.v.string(),
        })),
        severityOverrides: values_1.v.optional(values_1.v.any()),
        active: values_1.v.optional(values_1.v.boolean()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var id;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, ctx.db.insert("qcRulesets", {
                        tenantId: undefined, // TODO: resolve from project
                        projectId: args.projectId,
                        name: args.name,
                        description: args.description,
                        preset: (_a = args.preset) !== null && _a !== void 0 ? _a : "CUSTOM",
                        requiredDocs: args.requiredDocs,
                        coverageThresholds: args.coverageThresholds,
                        securityPaths: args.securityPaths,
                        gateDefinitions: args.gateDefinitions,
                        severityOverrides: args.severityOverrides,
                        active: (_b = args.active) !== null && _b !== void 0 ? _b : true,
                        isBuiltIn: false,
                    })];
                case 1:
                    id = _c.sent();
                    return [2 /*return*/, { id: id }];
            }
        });
    }); },
});
/**
 * Update a ruleset
 */
exports.update = (0, server_1.mutation)({
    args: {
        id: values_1.v.id("qcRulesets"),
        name: values_1.v.optional(values_1.v.string()),
        description: values_1.v.optional(values_1.v.string()),
        requiredDocs: values_1.v.optional(values_1.v.array(values_1.v.string())),
        coverageThresholds: values_1.v.optional(values_1.v.object({
            unit: values_1.v.number(),
            integration: values_1.v.number(),
            e2e: values_1.v.number(),
        })),
        securityPaths: values_1.v.optional(values_1.v.array(values_1.v.string())),
        gateDefinitions: values_1.v.optional(values_1.v.array(values_1.v.object({
            name: values_1.v.string(),
            condition: values_1.v.string(),
            severity: values_1.v.string(),
        }))),
        severityOverrides: values_1.v.optional(values_1.v.any()),
        active: values_1.v.optional(values_1.v.boolean()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var ruleset, updates;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.id)];
                case 1:
                    ruleset = _a.sent();
                    if (!ruleset) {
                        throw new Error("Ruleset not found");
                    }
                    if (ruleset.isBuiltIn) {
                        throw new Error("Cannot modify built-in rulesets");
                    }
                    updates = {};
                    if (args.name !== undefined)
                        updates.name = args.name;
                    if (args.description !== undefined)
                        updates.description = args.description;
                    if (args.requiredDocs !== undefined)
                        updates.requiredDocs = args.requiredDocs;
                    if (args.coverageThresholds !== undefined)
                        updates.coverageThresholds = args.coverageThresholds;
                    if (args.securityPaths !== undefined)
                        updates.securityPaths = args.securityPaths;
                    if (args.gateDefinitions !== undefined)
                        updates.gateDefinitions = args.gateDefinitions;
                    if (args.severityOverrides !== undefined)
                        updates.severityOverrides = args.severityOverrides;
                    if (args.active !== undefined)
                        updates.active = args.active;
                    return [4 /*yield*/, ctx.db.patch(args.id, updates)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
/**
 * Delete a ruleset
 */
exports.remove = (0, server_1.mutation)({
    args: { id: values_1.v.id("qcRulesets") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var ruleset;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.id)];
                case 1:
                    ruleset = _a.sent();
                    if (!ruleset) {
                        throw new Error("Ruleset not found");
                    }
                    if (ruleset.isBuiltIn) {
                        throw new Error("Cannot delete built-in rulesets");
                    }
                    return [4 /*yield*/, ctx.db.delete(args.id)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
/**
 * Seed default rulesets
 */
exports.seedDefaults = (0, server_1.mutation)({
    args: {},
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var presets, created, _loop_1, _i, presets_1, preset;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    presets = [
                        {
                            name: "Pre-Release",
                            preset: "PRE_RELEASE",
                            description: "Full scan with strict gates for production releases",
                            requiredDocs: ["README.md", "docs/PRD*.md", "CHANGELOG.md"],
                            coverageThresholds: { unit: 80, integration: 70, e2e: 60 },
                            securityPaths: ["auth/**", "security/**", "api/**"],
                            gateDefinitions: [
                                { name: "PRD exists", condition: "requiredDocs", severity: "RED" },
                                { name: "Coverage meets threshold", condition: "coverageThresholds", severity: "RED" },
                                { name: "Security paths covered", condition: "securityPaths", severity: "RED" },
                                { name: "No RED findings", condition: "findings.red === 0", severity: "RED" },
                            ],
                        },
                        {
                            name: "Post-Merge",
                            preset: "POST_MERGE",
                            description: "Delta scan focused on changed files only",
                            requiredDocs: ["README.md"],
                            coverageThresholds: { unit: 60, integration: 40, e2e: 20 },
                            securityPaths: ["auth/**", "security/**"],
                            gateDefinitions: [
                                { name: "Changed files have tests", condition: "coverageThresholds", severity: "YELLOW" },
                                { name: "Docs updated if needed", condition: "docsDrift", severity: "YELLOW" },
                            ],
                        },
                        {
                            name: "Weekly Health",
                            preset: "WEEKLY_HEALTH",
                            description: "Broad scan with relaxed thresholds for trend monitoring",
                            requiredDocs: ["README.md", "docs/**/*.md"],
                            coverageThresholds: { unit: 50, integration: 30, e2e: 10 },
                            securityPaths: ["auth/**"],
                            gateDefinitions: [
                                { name: "Basic docs present", condition: "requiredDocs", severity: "YELLOW" },
                                { name: "Minimal coverage", condition: "coverageThresholds", severity: "YELLOW" },
                            ],
                        },
                        {
                            name: "Security Focus",
                            preset: "SECURITY_FOCUS",
                            description: "Narrow scan on security-critical paths only",
                            requiredDocs: ["docs/SECURITY*.md"],
                            coverageThresholds: { unit: 90, integration: 80, e2e: 70 },
                            securityPaths: ["auth/**", "security/**", "api/auth/**", "middleware/auth/**"],
                            gateDefinitions: [
                                { name: "Security docs exist", condition: "requiredDocs", severity: "RED" },
                                { name: "Security paths fully covered", condition: "securityPaths", severity: "RED" },
                                { name: "No security gaps", condition: "findings.category !== SECURITY_GAP", severity: "RED" },
                            ],
                        },
                    ];
                    created = [];
                    _loop_1 = function (preset) {
                        var existing, id;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, ctx.db
                                        .query("qcRulesets")
                                        .withIndex("by_preset", function (q) { return q.eq("preset", preset.preset); })
                                        .filter(function (q) { return q.eq(q.field("isBuiltIn"), true); })
                                        .first()];
                                case 1:
                                    existing = _b.sent();
                                    if (!!existing) return [3 /*break*/, 3];
                                    return [4 /*yield*/, ctx.db.insert("qcRulesets", {
                                            tenantId: undefined,
                                            projectId: undefined,
                                            name: preset.name,
                                            description: preset.description,
                                            preset: preset.preset,
                                            requiredDocs: preset.requiredDocs,
                                            coverageThresholds: preset.coverageThresholds,
                                            securityPaths: preset.securityPaths,
                                            gateDefinitions: preset.gateDefinitions,
                                            active: true,
                                            isBuiltIn: true,
                                        })];
                                case 2:
                                    id = _b.sent();
                                    created.push({ preset: preset.preset, id: id });
                                    _b.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, presets_1 = presets;
                    _a.label = 1;
                case 1:
                    if (!(_i < presets_1.length)) return [3 /*break*/, 4];
                    preset = presets_1[_i];
                    return [5 /*yield**/, _loop_1(preset)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, { created: created, count: created.length }];
            }
        });
    }); },
});

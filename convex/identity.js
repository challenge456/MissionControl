"use strict";
/**
 * Identity/Soul/Tools Governance
 *
 * OpenClaw-aligned agent identity validation, storage, and scanning.
 * Implements the IDENTITY.md, SOUL.md, TOOLS.md governance system.
 */
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
exports.updateValidationStatus = exports.upsertInternal = exports.getByAgentInternal = exports.listAgentsForScan = exports.scan = exports.upsert = exports.getComplianceReport = exports.getByAgent = exports.getDirectory = exports.validate = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var api_1 = require("./_generated/api");
var agentResolver_1 = require("./lib/agentResolver");
var armAudit_1 = require("./lib/armAudit");
// ============================================================================
// VALIDATION HELPERS
// ============================================================================
function validateIdentityFields(identity) {
    var errors = [];
    var warnings = [];
    // Required fields
    if (!identity.name || identity.name.trim().length === 0) {
        errors.push("IDENTITY: 'name' is required and must be non-empty");
    }
    if (!identity.creature || identity.creature.trim().length === 0) {
        errors.push("IDENTITY: 'creature' is required and must be non-empty");
    }
    if (!identity.vibe || identity.vibe.trim().length === 0) {
        errors.push("IDENTITY: 'vibe' is required and must be non-empty");
    }
    if (!identity.emoji || identity.emoji.trim().length === 0) {
        errors.push("IDENTITY: 'emoji' is required");
    }
    // Avatar path validation (recommended, not required)
    if (identity.avatarPath && identity.avatarPath.trim().length > 0) {
        var path = identity.avatarPath.trim();
        var isHttpUrl = /^https?:\/\//.test(path);
        var isDataUri = /^data:/.test(path);
        var isRelativePath = /^[a-zA-Z0-9_\-./]+$/.test(path) && !path.startsWith("/") && !path.includes("..");
        if (!isHttpUrl && !isDataUri && !isRelativePath) {
            errors.push("IDENTITY: 'avatarPath' must be a workspace-relative path, http(s) URL, or data URI");
        }
    }
    else {
        warnings.push("IDENTITY: 'avatarPath' is recommended but not set");
    }
    return { valid: errors.length === 0, errors: errors, warnings: warnings };
}
function validateSoulContent(soulContent) {
    var errors = [];
    var warnings = [];
    if (!soulContent || soulContent.trim().length === 0) {
        errors.push("SOUL: content is required (SOUL.md must not be empty)");
        return { valid: false, errors: errors, warnings: warnings };
    }
    // Check for recommended sections
    var content = soulContent.toLowerCase();
    if (!content.includes("core truths") && !content.includes("## core")) {
        warnings.push("SOUL: 'Core Truths' section is recommended");
    }
    if (!content.includes("boundaries") && !content.includes("## bound")) {
        warnings.push("SOUL: 'Boundaries' section is recommended");
    }
    if (!content.includes("vibe") && !content.includes("## vibe")) {
        warnings.push("SOUL: 'Vibe' section is recommended");
    }
    return { valid: errors.length === 0, errors: errors, warnings: warnings };
}
function computeSoulHash(content) {
    // Simple hash for change detection (not cryptographic)
    var hash = 0;
    for (var i = 0; i < content.length; i++) {
        var char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}
// ============================================================================
// QUERIES
// ============================================================================
/**
 * Validate an identity document against required fields.
 */
exports.validate = (0, server_1.query)({
    args: {
        name: values_1.v.optional(values_1.v.string()),
        creature: values_1.v.optional(values_1.v.string()),
        vibe: values_1.v.optional(values_1.v.string()),
        emoji: values_1.v.optional(values_1.v.string()),
        avatarPath: values_1.v.optional(values_1.v.string()),
        soulContent: values_1.v.optional(values_1.v.string()),
    },
    handler: function (_ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var identityResult, soulResult;
        return __generator(this, function (_a) {
            identityResult = validateIdentityFields(args);
            soulResult = validateSoulContent(args.soulContent);
            return [2 /*return*/, {
                    valid: identityResult.valid && soulResult.valid,
                    errors: __spreadArray(__spreadArray([], identityResult.errors, true), soulResult.errors, true),
                    warnings: __spreadArray(__spreadArray([], identityResult.warnings, true), soulResult.warnings, true),
                }];
        });
    }); },
});
/**
 * Get the identity directory: all agents with their identity info.
 */
exports.getDirectory = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var identities, projectAgents, agentIds_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("agentIdentities").collect()];
                case 1:
                    identities = _a.sent();
                    if (!args.projectId) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 2:
                    projectAgents = _a.sent();
                    agentIds_1 = new Set(projectAgents.map(function (a) { return a._id; }));
                    return [2 /*return*/, identities.filter(function (i) { return agentIds_1.has(i.agentId); })];
                case 3: return [2 /*return*/, identities];
            }
        });
    }); },
});
/**
 * Get identity for a specific agent.
 */
exports.getByAgent = (0, server_1.query)({
    args: {
        agentId: values_1.v.id("agents"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var identities;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("agentIdentities")
                        .withIndex("by_agent", function (q) { return q.eq("agentId", args.agentId); })
                        .collect()];
                case 1:
                    identities = _b.sent();
                    return [2 /*return*/, (_a = identities[0]) !== null && _a !== void 0 ? _a : null];
            }
        });
    }); },
});
/**
 * Get compliance report: agents grouped by validation status.
 */
exports.getComplianceReport = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var identities, agents, _a, agentMap, identityMap, valid, invalid, missing, partial, _i, agents_1, agent, identity;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.query("agentIdentities").collect()];
                case 1:
                    identities = _b.sent();
                    if (!args.projectId) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db.query("agents").withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); }).collect()];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, ctx.db.query("agents").collect()];
                case 4:
                    _a = _b.sent();
                    _b.label = 5;
                case 5:
                    agents = _a;
                    agentMap = new Map(agents.map(function (a) { return [a._id, a]; }));
                    identityMap = new Map(identities.map(function (i) { return [i.agentId, i]; }));
                    valid = [];
                    invalid = [];
                    missing = [];
                    partial = [];
                    for (_i = 0, agents_1 = agents; _i < agents_1.length; _i++) {
                        agent = agents_1[_i];
                        identity = identityMap.get(agent._id);
                        if (!identity) {
                            missing.push({ agent: agent, identity: null, status: "MISSING" });
                        }
                        else if (identity.validationStatus === "VALID") {
                            valid.push({ agent: agent, identity: identity, status: "VALID" });
                        }
                        else if (identity.validationStatus === "INVALID") {
                            invalid.push({ agent: agent, identity: identity, status: "INVALID" });
                        }
                        else {
                            partial.push({ agent: agent, identity: identity, status: "PARTIAL" });
                        }
                    }
                    return [2 /*return*/, {
                            total: agents.length,
                            valid: valid.length,
                            invalid: invalid.length,
                            missing: missing.length,
                            partial: partial.length,
                            details: { valid: valid, invalid: invalid, missing: missing, partial: partial },
                        }];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
/**
 * Create or update an agent identity record with validation.
 */
exports.upsert = (0, server_1.mutation)({
    args: {
        agentId: values_1.v.id("agents"),
        name: values_1.v.string(),
        creature: values_1.v.optional(values_1.v.string()),
        vibe: values_1.v.optional(values_1.v.string()),
        emoji: values_1.v.optional(values_1.v.string()),
        avatarPath: values_1.v.optional(values_1.v.string()),
        soulContent: values_1.v.optional(values_1.v.string()),
        toolsNotes: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var identityResult, soulResult, allErrors, validationStatus, hasName, hasSoul, soulHash, agent, resolved, existing, soulChanged, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    identityResult = validateIdentityFields(args);
                    soulResult = validateSoulContent(args.soulContent);
                    allErrors = __spreadArray(__spreadArray([], identityResult.errors, true), soulResult.errors, true);
                    validationStatus = "VALID";
                    if (allErrors.length > 0) {
                        hasName = !!args.name && args.name.trim().length > 0;
                        hasSoul = !!args.soulContent && args.soulContent.trim().length > 0;
                        validationStatus = (hasName || hasSoul) ? "PARTIAL" : "INVALID";
                    }
                    soulHash = args.soulContent ? computeSoulHash(args.soulContent) : undefined;
                    return [4 /*yield*/, ctx.db.get(args.agentId)];
                case 1:
                    agent = _a.sent();
                    return [4 /*yield*/, (0, agentResolver_1.resolveAgentRef)({ db: ctx.db }, { agentId: args.agentId, createIfMissing: true })];
                case 2:
                    resolved = _a.sent();
                    return [4 /*yield*/, ctx.db
                            .query("agentIdentities")
                            .withIndex("by_agent", function (q) { return q.eq("agentId", args.agentId); })
                            .first()];
                case 3:
                    existing = _a.sent();
                    soulChanged = existing && existing.soulHash && soulHash && existing.soulHash !== soulHash;
                    if (!existing) return [3 /*break*/, 8];
                    return [4 /*yield*/, ctx.db.patch(existing._id, {
                            tenantId: agent === null || agent === void 0 ? void 0 : agent.tenantId,
                            name: args.name,
                            templateId: resolved === null || resolved === void 0 ? void 0 : resolved.templateId,
                            versionId: resolved === null || resolved === void 0 ? void 0 : resolved.versionId,
                            instanceId: resolved === null || resolved === void 0 ? void 0 : resolved.instanceId,
                            legacyAgentId: args.agentId,
                            creature: args.creature,
                            vibe: args.vibe,
                            emoji: args.emoji,
                            avatarPath: args.avatarPath,
                            soulContent: args.soulContent,
                            soulHash: soulHash,
                            toolsNotes: args.toolsNotes,
                            validationStatus: validationStatus,
                            validationErrors: allErrors.length > 0 ? allErrors : undefined,
                            lastScannedAt: Date.now(),
                        })];
                case 4:
                    _a.sent();
                    if (!soulChanged) return [3 /*break*/, 6];
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: undefined,
                            actorType: "SYSTEM",
                            actorId: args.agentId,
                            action: "SOUL_CHANGED",
                            description: "SOUL.md changed for agent ".concat(args.name, ". Previous hash: ").concat(existing.soulHash, ", new hash: ").concat(soulHash, ". Per OpenClaw rules, the user has been notified."),
                            targetType: "AGENT",
                            targetId: args.agentId,
                            agentId: args.agentId,
                            metadata: {
                                agentId: args.agentId,
                                previousSoulHash: existing.soulHash,
                                newSoulHash: soulHash,
                            },
                        })];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                        tenantId: agent === null || agent === void 0 ? void 0 : agent.tenantId,
                        projectId: agent === null || agent === void 0 ? void 0 : agent.projectId,
                        templateId: resolved === null || resolved === void 0 ? void 0 : resolved.templateId,
                        versionId: resolved === null || resolved === void 0 ? void 0 : resolved.versionId,
                        instanceId: resolved === null || resolved === void 0 ? void 0 : resolved.instanceId,
                        legacyAgentId: args.agentId,
                        type: "IDENTITY_UPDATED",
                        summary: "Identity updated for ".concat(args.name),
                        relatedTable: "agentIdentities",
                        relatedId: existing._id,
                    })];
                case 7:
                    _a.sent();
                    return [2 /*return*/, { id: existing._id, validationStatus: validationStatus, errors: allErrors, soulChanged: soulChanged }];
                case 8: return [4 /*yield*/, ctx.db.insert("agentIdentities", {
                        tenantId: agent === null || agent === void 0 ? void 0 : agent.tenantId,
                        agentId: args.agentId,
                        templateId: resolved === null || resolved === void 0 ? void 0 : resolved.templateId,
                        versionId: resolved === null || resolved === void 0 ? void 0 : resolved.versionId,
                        instanceId: resolved === null || resolved === void 0 ? void 0 : resolved.instanceId,
                        legacyAgentId: args.agentId,
                        name: args.name,
                        creature: args.creature,
                        vibe: args.vibe,
                        emoji: args.emoji,
                        avatarPath: args.avatarPath,
                        soulContent: args.soulContent,
                        soulHash: soulHash,
                        toolsNotes: args.toolsNotes,
                        validationStatus: validationStatus,
                        validationErrors: allErrors.length > 0 ? allErrors : undefined,
                        lastScannedAt: Date.now(),
                    })];
                case 9:
                    id = _a.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: agent === null || agent === void 0 ? void 0 : agent.tenantId,
                            projectId: agent === null || agent === void 0 ? void 0 : agent.projectId,
                            templateId: resolved === null || resolved === void 0 ? void 0 : resolved.templateId,
                            versionId: resolved === null || resolved === void 0 ? void 0 : resolved.versionId,
                            instanceId: resolved === null || resolved === void 0 ? void 0 : resolved.instanceId,
                            legacyAgentId: args.agentId,
                            type: "IDENTITY_UPDATED",
                            summary: "Identity created for ".concat(args.name),
                            relatedTable: "agentIdentities",
                            relatedId: id,
                        })];
                case 10:
                    _a.sent();
                    return [2 /*return*/, { id: id, validationStatus: validationStatus, errors: allErrors, soulChanged: false }];
            }
        });
    }); },
});
// ============================================================================
// ACTIONS
// ============================================================================
/**
 * Scan all agents for missing/invalid identity/soul/tools files.
 * Writes results to agentIdentities table.
 */
exports.scan = (0, server_1.action)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var agents, results, _i, agents_2, agent, existing, identityResult, soulResult, allErrors, status_1, hasName, hasSoul;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.runQuery(api_1.api.identity.listAgentsForScan)];
                case 1:
                    agents = _a.sent();
                    results = {
                        scanned: 0,
                        valid: 0,
                        invalid: 0,
                        missing: 0,
                        partial: 0,
                    };
                    _i = 0, agents_2 = agents;
                    _a.label = 2;
                case 2:
                    if (!(_i < agents_2.length)) return [3 /*break*/, 8];
                    agent = agents_2[_i];
                    results.scanned++;
                    return [4 /*yield*/, ctx.runQuery(api_1.api.identity.getByAgentInternal, {
                            agentId: agent._id,
                        })];
                case 3:
                    existing = _a.sent();
                    if (!!existing) return [3 /*break*/, 5];
                    // Create a MISSING identity record from agent data
                    return [4 /*yield*/, ctx.runMutation(api_1.api.identity.upsertInternal, {
                            agentId: agent._id,
                            name: agent.name || "Unknown",
                            creature: undefined,
                            vibe: undefined,
                            emoji: agent.emoji || undefined,
                            avatarPath: undefined,
                            soulContent: undefined,
                            toolsNotes: undefined,
                            validationStatus: "MISSING",
                            validationErrors: ["No identity record found. Create IDENTITY.md and SOUL.md for this agent."],
                        })];
                case 4:
                    // Create a MISSING identity record from agent data
                    _a.sent();
                    results.missing++;
                    return [3 /*break*/, 7];
                case 5:
                    identityResult = validateIdentityFields(existing);
                    soulResult = validateSoulContent(existing.soulContent);
                    allErrors = __spreadArray(__spreadArray([], identityResult.errors, true), soulResult.errors, true);
                    status_1 = "VALID";
                    if (allErrors.length > 0) {
                        hasName = !!existing.name && existing.name.trim().length > 0;
                        hasSoul = !!existing.soulContent && existing.soulContent.trim().length > 0;
                        status_1 = (hasName || hasSoul) ? "PARTIAL" : "INVALID";
                    }
                    return [4 /*yield*/, ctx.runMutation(api_1.api.identity.updateValidationStatus, {
                            identityId: existing._id,
                            validationStatus: status_1,
                            validationErrors: allErrors.length > 0 ? allErrors : undefined,
                        })];
                case 6:
                    _a.sent();
                    if (status_1 === "VALID")
                        results.valid++;
                    else if (status_1 === "INVALID")
                        results.invalid++;
                    else
                        results.partial++;
                    _a.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8: return [2 /*return*/, results];
            }
        });
    }); },
});
// ============================================================================
// INTERNAL HELPERS (for use by actions)
// ============================================================================
exports.listAgentsForScan = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("agents").collect()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.getByAgentInternal = (0, server_1.query)({
    args: { agentId: values_1.v.id("agents") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("agentIdentities")
                        .withIndex("by_agent", function (q) { return q.eq("agentId", args.agentId); })
                        .first()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.upsertInternal = (0, server_1.mutation)({
    args: {
        agentId: values_1.v.id("agents"),
        name: values_1.v.string(),
        creature: values_1.v.optional(values_1.v.string()),
        vibe: values_1.v.optional(values_1.v.string()),
        emoji: values_1.v.optional(values_1.v.string()),
        avatarPath: values_1.v.optional(values_1.v.string()),
        soulContent: values_1.v.optional(values_1.v.string()),
        toolsNotes: values_1.v.optional(values_1.v.string()),
        validationStatus: values_1.v.union(values_1.v.literal("VALID"), values_1.v.literal("INVALID"), values_1.v.literal("MISSING"), values_1.v.literal("PARTIAL")),
        validationErrors: values_1.v.optional(values_1.v.array(values_1.v.string())),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var existing;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("agentIdentities")
                        .withIndex("by_agent", function (q) { return q.eq("agentId", args.agentId); })
                        .first()];
                case 1:
                    existing = _a.sent();
                    if (!existing) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db.patch(existing._id, __assign(__assign({}, args), { lastScannedAt: Date.now() }))];
                case 2:
                    _a.sent();
                    return [2 /*return*/, existing._id];
                case 3: return [4 /*yield*/, ctx.db.insert("agentIdentities", __assign(__assign({}, args), { lastScannedAt: Date.now() }))];
                case 4: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.updateValidationStatus = (0, server_1.mutation)({
    args: {
        identityId: values_1.v.id("agentIdentities"),
        validationStatus: values_1.v.union(values_1.v.literal("VALID"), values_1.v.literal("INVALID"), values_1.v.literal("MISSING"), values_1.v.literal("PARTIAL")),
        validationErrors: values_1.v.optional(values_1.v.array(values_1.v.string())),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.patch(args.identityId, {
                        validationStatus: args.validationStatus,
                        validationErrors: args.validationErrors,
                        lastScannedAt: Date.now(),
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
});

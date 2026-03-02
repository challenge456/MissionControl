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
exports.upsertAgentIdentity = exports.listIdentities = exports.getIdentity = void 0;
var server_1 = require("../_generated/server");
var values_1 = require("convex/values");
var agentResolver_1 = require("../lib/agentResolver");
var armAudit_1 = require("../lib/armAudit");
exports.getIdentity = (0, server_1.query)({
    args: {
        instanceId: values_1.v.optional(values_1.v.id("agentInstances")),
        agentId: values_1.v.optional(values_1.v.id("agents")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var agentId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.instanceId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("agentIdentities")
                            .withIndex("by_instance", function (q) { return q.eq("instanceId", args.instanceId); })
                            .first()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    agentId = args.agentId;
                    if (!agentId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db
                            .query("agentIdentities")
                            .withIndex("by_agent", function (q) { return q.eq("agentId", agentId); })
                            .first()];
                case 3: return [2 /*return*/, _a.sent()];
                case 4: return [2 /*return*/, null];
            }
        });
    }); },
});
exports.listIdentities = (0, server_1.query)({
    args: {
        tenantId: values_1.v.optional(values_1.v.id("tenants")),
        templateId: values_1.v.optional(values_1.v.id("agentTemplates")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.templateId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("agentIdentities")
                            .withIndex("by_template", function (q) { return q.eq("templateId", args.templateId); })
                            .collect()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    if (!args.tenantId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db
                            .query("agentIdentities")
                            .withIndex("by_tenant", function (q) { return q.eq("tenantId", args.tenantId); })
                            .collect()];
                case 3: return [2 /*return*/, _a.sent()];
                case 4: return [4 /*yield*/, ctx.db.query("agentIdentities").collect()];
                case 5: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.upsertAgentIdentity = (0, server_1.mutation)({
    args: {
        agentId: values_1.v.id("agents"),
        name: values_1.v.string(),
        creature: values_1.v.optional(values_1.v.string()),
        vibe: values_1.v.optional(values_1.v.string()),
        emoji: values_1.v.optional(values_1.v.string()),
        avatarPath: values_1.v.optional(values_1.v.string()),
        soulContent: values_1.v.optional(values_1.v.string()),
        toolsNotes: values_1.v.optional(values_1.v.string()),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var agent, resolved, existing, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.agentId)];
                case 1:
                    agent = _a.sent();
                    if (!agent)
                        throw new Error("Agent not found");
                    return [4 /*yield*/, (0, agentResolver_1.resolveAgentRef)({ db: ctx.db }, { agentId: args.agentId, createIfMissing: true })];
                case 2:
                    resolved = _a.sent();
                    return [4 /*yield*/, ctx.db
                            .query("agentIdentities")
                            .withIndex("by_agent", function (q) { return q.eq("agentId", args.agentId); })
                            .first()];
                case 3:
                    existing = _a.sent();
                    if (!existing) return [3 /*break*/, 7];
                    return [4 /*yield*/, ctx.db.patch(existing._id, {
                            tenantId: agent.tenantId,
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
                            toolsNotes: args.toolsNotes,
                            metadata: args.metadata,
                        })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: agent.tenantId,
                            projectId: agent.projectId,
                            templateId: resolved === null || resolved === void 0 ? void 0 : resolved.templateId,
                            versionId: resolved === null || resolved === void 0 ? void 0 : resolved.versionId,
                            instanceId: resolved === null || resolved === void 0 ? void 0 : resolved.instanceId,
                            legacyAgentId: args.agentId,
                            type: "IDENTITY_UPDATED",
                            summary: "Identity updated for ".concat(args.name),
                            relatedTable: "agentIdentities",
                            relatedId: existing._id,
                        })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, ctx.db.get(existing._id)];
                case 6: return [2 /*return*/, _a.sent()];
                case 7: return [4 /*yield*/, ctx.db.insert("agentIdentities", {
                        tenantId: agent.tenantId,
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
                        toolsNotes: args.toolsNotes,
                        validationStatus: "VALID",
                        metadata: args.metadata,
                    })];
                case 8:
                    id = _a.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: agent.tenantId,
                            projectId: agent.projectId,
                            templateId: resolved === null || resolved === void 0 ? void 0 : resolved.templateId,
                            versionId: resolved === null || resolved === void 0 ? void 0 : resolved.versionId,
                            instanceId: resolved === null || resolved === void 0 ? void 0 : resolved.instanceId,
                            legacyAgentId: args.agentId,
                            type: "IDENTITY_UPDATED",
                            summary: "Identity created for ".concat(args.name),
                            relatedTable: "agentIdentities",
                            relatedId: id,
                        })];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, ctx.db.get(id)];
                case 10: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});

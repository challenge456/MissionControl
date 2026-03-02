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
exports.transitionInstance = exports.listInstances = exports.getInstance = exports.createInstance = void 0;
var values_1 = require("convex/values");
var server_1 = require("../_generated/server");
var armAudit_1 = require("../lib/armAudit");
var getActiveTenant_1 = require("../lib/getActiveTenant");
var instanceStatus = values_1.v.union(values_1.v.literal("PROVISIONING"), values_1.v.literal("ACTIVE"), values_1.v.literal("PAUSED"), values_1.v.literal("READONLY"), values_1.v.literal("DRAINING"), values_1.v.literal("QUARANTINED"), values_1.v.literal("RETIRED"));
exports.createInstance = (0, server_1.mutation)({
    args: {
        tenantId: values_1.v.optional(values_1.v.id("tenants")),
        projectId: values_1.v.optional(values_1.v.id("projects")),
        templateId: values_1.v.id("agentTemplates"),
        versionId: values_1.v.id("agentVersions"),
        environmentId: values_1.v.optional(values_1.v.id("environments")),
        name: values_1.v.string(),
        legacyAgentId: values_1.v.optional(values_1.v.id("agents")),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var tenantId, existing, _a, now, instanceId;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, getActiveTenant_1.resolveActiveTenantId)({ db: ctx.db }, {
                        tenantId: args.tenantId,
                        projectId: args.projectId,
                        templateId: args.templateId,
                        versionId: args.versionId,
                        environmentId: args.environmentId,
                        createDefaultIfMissing: true,
                    })];
                case 1:
                    tenantId = _b.sent();
                    if (!args.legacyAgentId) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db
                            .query("agentInstances")
                            .withIndex("by_legacy_agent", function (q) { return q.eq("legacyAgentId", args.legacyAgentId); })
                            .first()];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = null;
                    _b.label = 4;
                case 4:
                    existing = _a;
                    if (existing) {
                        return [2 /*return*/, existing];
                    }
                    now = Date.now();
                    return [4 /*yield*/, ctx.db.insert("agentInstances", {
                            tenantId: tenantId,
                            projectId: args.projectId,
                            templateId: args.templateId,
                            versionId: args.versionId,
                            environmentId: args.environmentId,
                            name: args.name,
                            status: "PROVISIONING",
                            legacyAgentId: args.legacyAgentId,
                            activatedAt: now,
                            metadata: args.metadata,
                        })];
                case 5:
                    instanceId = _b.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: tenantId,
                            projectId: args.projectId,
                            templateId: args.templateId,
                            versionId: args.versionId,
                            instanceId: instanceId,
                            legacyAgentId: args.legacyAgentId,
                            type: "INSTANCE_CREATED",
                            summary: "Instance created: ".concat(args.name),
                            relatedTable: "agentInstances",
                            relatedId: instanceId,
                        })];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, ctx.db.get(instanceId)];
                case 7: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
exports.getInstance = (0, server_1.query)({
    args: { instanceId: values_1.v.id("agentInstances") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.instanceId)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.listInstances = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        templateId: values_1.v.optional(values_1.v.id("agentTemplates")),
        status: values_1.v.optional(instanceStatus),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("agentInstances")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 1:
                    rows = _a.sent();
                    return [3 /*break*/, 6];
                case 2:
                    if (!args.templateId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db
                            .query("agentInstances")
                            .withIndex("by_template", function (q) { return q.eq("templateId", args.templateId); })
                            .collect()];
                case 3:
                    rows = _a.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, ctx.db.query("agentInstances").collect()];
                case 5:
                    rows = _a.sent();
                    _a.label = 6;
                case 6:
                    if (args.status) {
                        rows = rows.filter(function (row) { return row.status === args.status; });
                    }
                    return [2 /*return*/, rows.sort(function (a, b) { return b._creationTime - a._creationTime; })];
            }
        });
    }); },
});
exports.transitionInstance = (0, server_1.mutation)({
    args: {
        instanceId: values_1.v.id("agentInstances"),
        status: instanceStatus,
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var instance;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.instanceId)];
                case 1:
                    instance = _b.sent();
                    if (!instance) {
                        throw new Error("Instance not found");
                    }
                    return [4 /*yield*/, ctx.db.patch(args.instanceId, {
                            status: args.status,
                            retiredAt: args.status === "RETIRED" ? Date.now() : instance.retiredAt,
                            metadata: (_a = args.metadata) !== null && _a !== void 0 ? _a : instance.metadata,
                        })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: instance.tenantId,
                            projectId: instance.projectId,
                            templateId: instance.templateId,
                            versionId: instance.versionId,
                            instanceId: args.instanceId,
                            legacyAgentId: instance.legacyAgentId,
                            type: "INSTANCE_TRANSITIONED",
                            summary: "Instance transitioned ".concat(instance.status, " -> ").concat(args.status),
                            relatedTable: "agentInstances",
                            relatedId: args.instanceId,
                        })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, ctx.db.get(args.instanceId)];
                case 4: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});

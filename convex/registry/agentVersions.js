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
exports.transitionVersion = exports.listVersions = exports.getVersion = exports.createVersion = void 0;
var values_1 = require("convex/values");
var server_1 = require("../_generated/server");
var genomeHash_1 = require("../lib/genomeHash");
var armAudit_1 = require("../lib/armAudit");
var getActiveTenant_1 = require("../lib/getActiveTenant");
var versionStatus = values_1.v.union(values_1.v.literal("DRAFT"), values_1.v.literal("TESTING"), values_1.v.literal("CANDIDATE"), values_1.v.literal("APPROVED"), values_1.v.literal("DEPRECATED"), values_1.v.literal("RETIRED"));
exports.createVersion = (0, server_1.mutation)({
    args: {
        tenantId: values_1.v.optional(values_1.v.id("tenants")),
        projectId: values_1.v.optional(values_1.v.id("projects")),
        templateId: values_1.v.id("agentTemplates"),
        genome: values_1.v.object({
            modelConfig: values_1.v.object({
                provider: values_1.v.string(),
                modelId: values_1.v.string(),
                temperature: values_1.v.optional(values_1.v.number()),
                maxTokens: values_1.v.optional(values_1.v.number()),
            }),
            promptBundleHash: values_1.v.string(),
            toolManifestHash: values_1.v.string(),
            provenance: values_1.v.object({
                createdBy: values_1.v.string(),
                source: values_1.v.string(),
                createdAt: values_1.v.number(),
            }),
        }),
        status: values_1.v.optional(versionStatus),
        notes: values_1.v.optional(values_1.v.string()),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var tenantId, existing, maxVersion, now, genomeHash, versionId;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, getActiveTenant_1.resolveActiveTenantId)({ db: ctx.db }, {
                        tenantId: args.tenantId,
                        projectId: args.projectId,
                        templateId: args.templateId,
                        createDefaultIfMissing: true,
                    })];
                case 1:
                    tenantId = _b.sent();
                    return [4 /*yield*/, ctx.db
                            .query("agentVersions")
                            .withIndex("by_template", function (q) { return q.eq("templateId", args.templateId); })
                            .collect()];
                case 2:
                    existing = _b.sent();
                    maxVersion = existing.reduce(function (max, row) { return Math.max(max, row.version); }, 0);
                    now = Date.now();
                    genomeHash = (0, genomeHash_1.computeGenomeHash)(args.genome);
                    return [4 /*yield*/, ctx.db.insert("agentVersions", {
                            tenantId: tenantId,
                            projectId: args.projectId,
                            templateId: args.templateId,
                            version: maxVersion + 1,
                            genomeHash: genomeHash,
                            genome: args.genome,
                            status: (_a = args.status) !== null && _a !== void 0 ? _a : "DRAFT",
                            notes: args.notes,
                            createdAt: now,
                            updatedAt: now,
                            metadata: args.metadata,
                        })];
                case 3:
                    versionId = _b.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: tenantId,
                            projectId: args.projectId,
                            templateId: args.templateId,
                            versionId: versionId,
                            type: "VERSION_CREATED",
                            summary: "Version ".concat(maxVersion + 1, " created"),
                            payload: { genomeHash: genomeHash },
                            relatedTable: "agentVersions",
                            relatedId: versionId,
                        })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, ctx.db.get(versionId)];
                case 5: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
exports.getVersion = (0, server_1.query)({
    args: { versionId: values_1.v.id("agentVersions") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.versionId)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.listVersions = (0, server_1.query)({
    args: {
        templateId: values_1.v.id("agentTemplates"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("agentVersions")
                        .withIndex("by_template", function (q) { return q.eq("templateId", args.templateId); })
                        .collect()];
                case 1:
                    rows = _a.sent();
                    return [2 /*return*/, rows.sort(function (a, b) { return b.version - a.version; })];
            }
        });
    }); },
});
exports.transitionVersion = (0, server_1.mutation)({
    args: {
        versionId: values_1.v.id("agentVersions"),
        status: versionStatus,
        notes: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var existing;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.versionId)];
                case 1:
                    existing = _b.sent();
                    if (!existing) {
                        throw new Error("Version not found");
                    }
                    return [4 /*yield*/, ctx.db.patch(args.versionId, {
                            status: args.status,
                            notes: (_a = args.notes) !== null && _a !== void 0 ? _a : existing.notes,
                            updatedAt: Date.now(),
                        })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: existing.tenantId,
                            projectId: existing.projectId,
                            templateId: existing.templateId,
                            versionId: args.versionId,
                            type: "VERSION_TRANSITIONED",
                            summary: "Version transitioned ".concat(existing.status, " -> ").concat(args.status),
                            relatedTable: "agentVersions",
                            relatedId: args.versionId,
                        })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, ctx.db.get(args.versionId)];
                case 4: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});

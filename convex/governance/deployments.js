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
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDeployments = exports.rollbackDeployment = exports.activateDeployment = exports.createDeployment = void 0;
var values_1 = require("convex/values");
var server_1 = require("../_generated/server");
var armAudit_1 = require("../lib/armAudit");
var getActiveTenant_1 = require("../lib/getActiveTenant");
var deploymentStatus = values_1.v.union(values_1.v.literal("PENDING"), values_1.v.literal("ACTIVE"), values_1.v.literal("ROLLING_BACK"), values_1.v.literal("RETIRED"));
exports.createDeployment = (0, server_1.mutation)({
    args: {
        tenantId: values_1.v.optional(values_1.v.id("tenants")),
        templateId: values_1.v.id("agentTemplates"),
        environmentId: values_1.v.id("environments"),
        targetVersionId: values_1.v.id("agentVersions"),
        previousVersionId: values_1.v.optional(values_1.v.id("agentVersions")),
        rolloutPolicy: values_1.v.optional(values_1.v.any()),
        createdBy: values_1.v.optional(values_1.v.id("operators")),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var tenantId, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, getActiveTenant_1.resolveActiveTenantId)({ db: ctx.db }, {
                        tenantId: args.tenantId,
                        templateId: args.templateId,
                        versionId: args.targetVersionId,
                        environmentId: args.environmentId,
                        createDefaultIfMissing: true,
                    })];
                case 1:
                    tenantId = _a.sent();
                    return [4 /*yield*/, ctx.db.insert("deployments", __assign(__assign({}, args), { tenantId: tenantId, status: "PENDING", createdAt: Date.now() }))];
                case 2:
                    id = _a.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: tenantId,
                            templateId: args.templateId,
                            versionId: args.targetVersionId,
                            type: "DEPLOYMENT_CREATED",
                            summary: "Deployment created for template ".concat(args.templateId),
                            relatedTable: "deployments",
                            relatedId: id,
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, ctx.db.get(id)];
                case 4: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.activateDeployment = (0, server_1.mutation)({
    args: {
        deploymentId: values_1.v.id("deployments"),
        approvedBy: values_1.v.optional(values_1.v.id("operators")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var deployment, related, _i, related_1, row;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.deploymentId)];
                case 1:
                    deployment = _a.sent();
                    if (!deployment)
                        throw new Error("Deployment not found");
                    return [4 /*yield*/, ctx.db.patch(args.deploymentId, {
                            status: "ACTIVE",
                            approvedBy: args.approvedBy,
                            activatedAt: Date.now(),
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, ctx.db
                            .query("deployments")
                            .withIndex("by_environment", function (q) { return q.eq("environmentId", deployment.environmentId); })
                            .collect()];
                case 3:
                    related = _a.sent();
                    _i = 0, related_1 = related;
                    _a.label = 4;
                case 4:
                    if (!(_i < related_1.length)) return [3 /*break*/, 7];
                    row = related_1[_i];
                    if (!(row._id !== args.deploymentId && row.status === "ACTIVE")) return [3 /*break*/, 6];
                    return [4 /*yield*/, ctx.db.patch(row._id, { status: "RETIRED" })];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7: return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                        tenantId: deployment.tenantId,
                        templateId: deployment.templateId,
                        versionId: deployment.targetVersionId,
                        type: "DEPLOYMENT_ACTIVATED",
                        summary: "Deployment activated: ".concat(args.deploymentId),
                        relatedTable: "deployments",
                        relatedId: args.deploymentId,
                    })];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, ctx.db.get(args.deploymentId)];
                case 9: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.rollbackDeployment = (0, server_1.mutation)({
    args: {
        deploymentId: values_1.v.id("deployments"),
        approvedBy: values_1.v.optional(values_1.v.id("operators")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var deployment, rollbackId;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.deploymentId)];
                case 1:
                    deployment = _b.sent();
                    if (!deployment)
                        throw new Error("Deployment not found");
                    if (!deployment.previousVersionId) {
                        throw new Error("No previousVersionId to roll back to");
                    }
                    return [4 /*yield*/, ctx.db.patch(args.deploymentId, {
                            status: "ROLLING_BACK",
                        })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, ctx.db.insert("deployments", {
                            tenantId: deployment.tenantId,
                            templateId: deployment.templateId,
                            environmentId: deployment.environmentId,
                            targetVersionId: deployment.previousVersionId,
                            previousVersionId: deployment.targetVersionId,
                            rolloutPolicy: deployment.rolloutPolicy,
                            status: "ACTIVE",
                            createdBy: deployment.createdBy,
                            approvedBy: args.approvedBy,
                            activatedAt: Date.now(),
                            createdAt: Date.now(),
                            metadata: {
                                rollbackOf: args.deploymentId,
                            },
                        })];
                case 3:
                    rollbackId = _b.sent();
                    return [4 /*yield*/, ctx.db.patch(args.deploymentId, { status: "RETIRED" })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: deployment.tenantId,
                            templateId: deployment.templateId,
                            versionId: deployment.previousVersionId,
                            type: "DEPLOYMENT_ROLLED_BACK",
                            summary: "Rollback created deployment ".concat(rollbackId),
                            relatedTable: "deployments",
                            relatedId: rollbackId,
                        })];
                case 5:
                    _b.sent();
                    _a = {};
                    return [4 /*yield*/, ctx.db.get(rollbackId)];
                case 6:
                    _a.rolledBackDeployment = _b.sent();
                    return [4 /*yield*/, ctx.db.get(args.deploymentId)];
                case 7: return [2 /*return*/, (_a.retiredDeployment = _b.sent(),
                        _a)];
            }
        });
    }); },
});
exports.listDeployments = (0, server_1.query)({
    args: {
        tenantId: values_1.v.optional(values_1.v.id("tenants")),
        templateId: values_1.v.optional(values_1.v.id("agentTemplates")),
        environmentId: values_1.v.optional(values_1.v.id("environments")),
        status: values_1.v.optional(deploymentStatus),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.templateId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("deployments")
                            .withIndex("by_template", function (q) { return q.eq("templateId", args.templateId); })
                            .collect()];
                case 1:
                    rows = _a.sent();
                    return [3 /*break*/, 8];
                case 2:
                    if (!args.environmentId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db
                            .query("deployments")
                            .withIndex("by_environment", function (q) { return q.eq("environmentId", args.environmentId); })
                            .collect()];
                case 3:
                    rows = _a.sent();
                    return [3 /*break*/, 8];
                case 4:
                    if (!args.tenantId) return [3 /*break*/, 6];
                    return [4 /*yield*/, ctx.db
                            .query("deployments")
                            .withIndex("by_tenant", function (q) { return q.eq("tenantId", args.tenantId); })
                            .collect()];
                case 5:
                    rows = _a.sent();
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, ctx.db.query("deployments").collect()];
                case 7:
                    rows = _a.sent();
                    _a.label = 8;
                case 8:
                    if (args.status) {
                        rows = rows.filter(function (row) { return row.status === args.status; });
                    }
                    return [2 /*return*/, rows.sort(function (a, b) { return b.createdAt - a.createdAt; })];
            }
        });
    }); },
});

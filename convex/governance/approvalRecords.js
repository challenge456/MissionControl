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
exports.listApprovals = exports.decideApproval = exports.createApprovalRecord = void 0;
var values_1 = require("convex/values");
var server_1 = require("../_generated/server");
var armAudit_1 = require("../lib/armAudit");
var getActiveTenant_1 = require("../lib/getActiveTenant");
var statusValidator = values_1.v.union(values_1.v.literal("PENDING"), values_1.v.literal("APPROVED"), values_1.v.literal("DENIED"), values_1.v.literal("EXPIRED"), values_1.v.literal("CANCELED"));
exports.createApprovalRecord = (0, server_1.mutation)({
    args: {
        tenantId: values_1.v.optional(values_1.v.id("tenants")),
        projectId: values_1.v.optional(values_1.v.id("projects")),
        instanceId: values_1.v.optional(values_1.v.id("agentInstances")),
        versionId: values_1.v.optional(values_1.v.id("agentVersions")),
        actionType: values_1.v.string(),
        riskLevel: values_1.v.union(values_1.v.literal("GREEN"), values_1.v.literal("YELLOW"), values_1.v.literal("RED")),
        rollbackPlan: values_1.v.optional(values_1.v.string()),
        justification: values_1.v.string(),
        escalationLevel: values_1.v.optional(values_1.v.number()),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var tenantId, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, getActiveTenant_1.resolveActiveTenantId)({ db: ctx.db }, {
                        tenantId: args.tenantId,
                        projectId: args.projectId,
                        instanceId: args.instanceId,
                        versionId: args.versionId,
                        createDefaultIfMissing: true,
                    })];
                case 1:
                    tenantId = _a.sent();
                    return [4 /*yield*/, ctx.db.insert("approvalRecords", __assign(__assign({}, args), { tenantId: tenantId, status: "PENDING", requestedAt: Date.now() }))];
                case 2:
                    id = _a.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: tenantId,
                            projectId: args.projectId,
                            instanceId: args.instanceId,
                            versionId: args.versionId,
                            type: "APPROVAL_REQUESTED",
                            summary: "Approval record requested for ".concat(args.actionType),
                            relatedTable: "approvalRecords",
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
exports.decideApproval = (0, server_1.mutation)({
    args: {
        approvalRecordId: values_1.v.id("approvalRecords"),
        status: values_1.v.union(values_1.v.literal("APPROVED"), values_1.v.literal("DENIED"), values_1.v.literal("CANCELED"), values_1.v.literal("EXPIRED")),
        decisionReason: values_1.v.optional(values_1.v.string()),
        decidedBy: values_1.v.optional(values_1.v.id("operators")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var existing;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.approvalRecordId)];
                case 1:
                    existing = _a.sent();
                    if (!existing)
                        throw new Error("Approval record not found");
                    return [4 /*yield*/, ctx.db.patch(args.approvalRecordId, {
                            status: args.status,
                            decisionReason: args.decisionReason,
                            decidedBy: args.decidedBy,
                            decidedAt: Date.now(),
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: existing.tenantId,
                            projectId: existing.projectId,
                            instanceId: existing.instanceId,
                            versionId: existing.versionId,
                            type: "APPROVAL_DECIDED",
                            summary: "Approval record ".concat(args.status.toLowerCase()),
                            relatedTable: "approvalRecords",
                            relatedId: args.approvalRecordId,
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, ctx.db.get(args.approvalRecordId)];
                case 4: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.listApprovals = (0, server_1.query)({
    args: {
        tenantId: values_1.v.optional(values_1.v.id("tenants")),
        projectId: values_1.v.optional(values_1.v.id("projects")),
        status: values_1.v.optional(statusValidator),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var rows, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("approvalRecords")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 1:
                    _a = _c.sent();
                    return [3 /*break*/, 7];
                case 2:
                    if (!args.tenantId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db
                            .query("approvalRecords")
                            .withIndex("by_tenant", function (q) { return q.eq("tenantId", args.tenantId); })
                            .collect()];
                case 3:
                    _b = _c.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, ctx.db.query("approvalRecords").collect()];
                case 5:
                    _b = _c.sent();
                    _c.label = 6;
                case 6:
                    _a = _b;
                    _c.label = 7;
                case 7:
                    rows = _a;
                    if (args.status) {
                        rows = rows.filter(function (row) { return row.status === args.status; });
                    }
                    return [2 /*return*/, rows.sort(function (a, b) { return b.requestedAt - a.requestedAt; })];
            }
        });
    }); },
});

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
exports.listAssignments = exports.assignRole = void 0;
var server_1 = require("../_generated/server");
var values_1 = require("convex/values");
exports.assignRole = (0, server_1.mutation)({
    args: {
        operatorId: values_1.v.id("operators"),
        roleId: values_1.v.id("roles"),
        scope: values_1.v.optional(values_1.v.object({
            type: values_1.v.union(values_1.v.literal("tenant"), values_1.v.literal("project"), values_1.v.literal("environment")),
            id: values_1.v.string(),
        })),
        assignedBy: values_1.v.optional(values_1.v.id("operators")),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var existing, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("roleAssignments")
                        .withIndex("by_operator_role", function (q) { return q.eq("operatorId", args.operatorId).eq("roleId", args.roleId); })
                        .first()];
                case 1:
                    existing = _a.sent();
                    if (existing)
                        return [2 /*return*/, existing];
                    return [4 /*yield*/, ctx.db.insert("roleAssignments", __assign(__assign({}, args), { assignedAt: Date.now() }))];
                case 2:
                    id = _a.sent();
                    return [4 /*yield*/, ctx.db.get(id)];
                case 3: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.listAssignments = (0, server_1.query)({
    args: {
        operatorId: values_1.v.optional(values_1.v.id("operators")),
        roleId: values_1.v.optional(values_1.v.id("roles")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var operatorId, roleId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    operatorId = args.operatorId;
                    roleId = args.roleId;
                    if (!operatorId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("roleAssignments")
                            .withIndex("by_operator", function (q) { return q.eq("operatorId", operatorId); })
                            .collect()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    if (!roleId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db
                            .query("roleAssignments")
                            .withIndex("by_role", function (q) { return q.eq("roleId", roleId); })
                            .collect()];
                case 3: return [2 /*return*/, _a.sent()];
                case 4: return [4 /*yield*/, ctx.db.query("roleAssignments").collect()];
                case 5: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});

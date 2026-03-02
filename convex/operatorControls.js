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
exports.setMode = exports.listHistory = exports.getCurrent = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var operatorControls_1 = require("./lib/operatorControls");
var operatorModeValidator = values_1.v.union(values_1.v.literal("NORMAL"), values_1.v.literal("PAUSED"), values_1.v.literal("DRAINING"), values_1.v.literal("QUARANTINED"));
exports.getCurrent = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, operatorControls_1.getEffectiveOperatorControl)(ctx.db, args.projectId)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.listHistory = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 50;
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("operatorControls")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .order("desc")
                            .take(limit)];
                case 1: return [2 /*return*/, _b.sent()];
                case 2: return [4 /*yield*/, ctx.db.query("operatorControls").order("desc").take(limit)];
                case 3: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
exports.setMode = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        mode: operatorModeValidator,
        reason: values_1.v.optional(values_1.v.string()),
        userId: values_1.v.string(),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var now, id;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    now = Date.now();
                    return [4 /*yield*/, ctx.db.insert("operatorControls", {
                            projectId: args.projectId,
                            mode: args.mode,
                            reason: args.reason,
                            updatedBy: args.userId,
                            updatedAt: now,
                            metadata: args.metadata,
                        })];
                case 1:
                    id = _b.sent();
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: args.projectId,
                            actorType: "HUMAN",
                            actorId: args.userId,
                            action: "OPERATOR_MODE_UPDATED",
                            description: "Operator mode set to ".concat(args.mode).concat(args.reason ? " (".concat(args.reason, ")") : ""),
                            targetType: "OPERATOR_CONTROL",
                            targetId: id,
                            metadata: {
                                mode: args.mode,
                                reason: args.reason,
                            },
                        })];
                case 2:
                    _b.sent();
                    if (!(args.mode !== "NORMAL")) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.insert("alerts", {
                            projectId: args.projectId,
                            severity: args.mode === "QUARANTINED" ? "CRITICAL" : "WARNING",
                            type: "OPERATOR_CONTROL_MODE",
                            title: "Operator mode ".concat(args.mode),
                            description: args.reason || "System switched to ".concat(args.mode),
                            status: "OPEN",
                            metadata: {
                                mode: args.mode,
                                changedBy: args.userId,
                            },
                        })];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    _a = {
                        success: true
                    };
                    return [4 /*yield*/, ctx.db.get(id)];
                case 5: return [2 /*return*/, (_a.control = _b.sent(),
                        _a)];
            }
        });
    }); },
});

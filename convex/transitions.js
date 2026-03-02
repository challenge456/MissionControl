"use strict";
/**
 * Task transition event append-only.
 * Task status MUST be updated only via tasks.transitionTaskStatus.
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
exports.transitions_append = void 0;
exports.appendTransition = appendTransition;
var server_1 = require("./_generated/server");
var values_1 = require("convex/values");
function appendTransition(ctx, args) {
    return __awaiter(this, void 0, void 0, function () {
        var existing;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("taskTransitions")
                        .withIndex("by_idempotency", function (q) { return q.eq("idempotencyKey", args.idempotencyKey); })
                        .unique()];
                case 1:
                    existing = _a.sent();
                    if (existing) {
                        return [2 /*return*/, existing._id];
                    }
                    return [4 /*yield*/, ctx.db.insert("taskTransitions", {
                            taskId: args.taskId,
                            fromStatus: args.fromStatus,
                            toStatus: args.toStatus,
                            actorType: args.actorType,
                            actorAgentId: args.actorAgentId,
                            actorUserId: args.actorUserId,
                            reason: args.reason,
                            artifactsSnapshot: args.artifactsSnapshot,
                            idempotencyKey: args.idempotencyKey,
                        })];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
exports.transitions_append = (0, server_1.mutation)({
    args: {
        taskId: values_1.v.id("tasks"),
        fromStatus: values_1.v.string(),
        toStatus: values_1.v.string(),
        actorType: values_1.v.union(values_1.v.literal("AGENT"), values_1.v.literal("HUMAN"), values_1.v.literal("SYSTEM")),
        actorAgentId: values_1.v.optional(values_1.v.id("agents")),
        actorUserId: values_1.v.optional(values_1.v.string()),
        reason: values_1.v.optional(values_1.v.string()),
        artifactsSnapshot: values_1.v.optional(values_1.v.any()),
        idempotencyKey: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, appendTransition(ctx, args)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});

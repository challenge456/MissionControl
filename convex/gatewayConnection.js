"use strict";
/**
 * Gateway connection settings (OpenClaw Studio parity).
 * Stores only the Gateway URL; token is supplied via server env (GATEWAY_TOKEN).
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUrl = exports.get = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var GATEWAY_CONNECTION_ID = "default";
exports.get = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var row;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("gatewayConnection")
                        .withIndex("by_updatedAt")
                        .order("desc")
                        .first()];
                case 1:
                    row = _a.sent();
                    if (!row)
                        return [2 /*return*/, null];
                    return [2 /*return*/, { url: row.url, updatedAt: row.updatedAt }];
            }
        });
    }); },
});
exports.setUrl = (0, server_1.mutation)({
    args: { url: values_1.v.string(), updatedBy: values_1.v.optional(values_1.v.string()) },
    handler: function (ctx_1, _a) { return __awaiter(void 0, [ctx_1, _a], void 0, function (ctx, _b) {
        var now, existing;
        var url = _b.url, updatedBy = _b.updatedBy;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    now = Date.now();
                    return [4 /*yield*/, ctx.db
                            .query("gatewayConnection")
                            .withIndex("by_updatedAt")
                            .order("desc")
                            .first()];
                case 1:
                    existing = _c.sent();
                    if (!existing) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db.patch(existing._id, __assign({ url: url.trim(), updatedAt: now }, (updatedBy !== undefined && { updatedBy: updatedBy })))];
                case 2:
                    _c.sent();
                    return [2 /*return*/, existing._id];
                case 3: return [4 /*yield*/, ctx.db.insert("gatewayConnection", __assign({ url: url.trim(), updatedAt: now }, (updatedBy !== undefined && { updatedBy: updatedBy })))];
                case 4: return [2 /*return*/, _c.sent()];
            }
        });
    }); },
});

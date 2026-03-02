"use strict";
/**
 * Webhooks — Event Subscriptions & Delivery
 *
 * Subscribe to Mission Control events and receive HTTP POST notifications.
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markFailed = exports.markDelivered = exports.getWebhook = exports.getPendingDeliveries = exports.deliverPending = exports.triggerEvent = exports.remove = exports.update = exports.create = exports.getDeliveries = exports.get = exports.list = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var api_1 = require("./_generated/api");
/** HMAC-SHA256 hex using Web Crypto (Convex default runtime). */
function hmacSha256Hex(secret, data) {
    return __awaiter(this, void 0, void 0, function () {
        var key, sig;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])];
                case 1:
                    key = _a.sent();
                    return [4 /*yield*/, crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data))];
                case 2:
                    sig = _a.sent();
                    return [2 /*return*/, Array.from(new Uint8Array(sig))
                            .map(function (b) { return b.toString(16).padStart(2, "0"); })
                            .join("")];
            }
        });
    });
}
// ============================================================================
// QUERIES
// ============================================================================
exports.list = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("webhooks")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2: return [4 /*yield*/, ctx.db.query("webhooks").collect()];
                case 3: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.get = (0, server_1.query)({
    args: { webhookId: values_1.v.id("webhooks") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.webhookId)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.getDeliveries = (0, server_1.query)({
    args: {
        webhookId: values_1.v.id("webhooks"),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    limit = args.limit || 50;
                    return [4 /*yield*/, ctx.db
                            .query("webhookDeliveries")
                            .withIndex("by_webhook", function (q) { return q.eq("webhookId", args.webhookId); })
                            .order("desc")
                            .take(limit)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
exports.create = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        name: values_1.v.string(),
        url: values_1.v.string(),
        secret: values_1.v.string(),
        events: values_1.v.array(values_1.v.string()),
        filters: values_1.v.optional(values_1.v.object({
            taskTypes: values_1.v.optional(values_1.v.array(values_1.v.string())),
            agentIds: values_1.v.optional(values_1.v.array(values_1.v.id("agents"))),
            statuses: values_1.v.optional(values_1.v.array(values_1.v.string())),
        })),
        createdBy: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var webhookId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Validate URL
                    try {
                        new URL(args.url);
                    }
                    catch (_b) {
                        throw new Error("Invalid URL");
                    }
                    return [4 /*yield*/, ctx.db.insert("webhooks", {
                            projectId: args.projectId,
                            name: args.name,
                            url: args.url,
                            secret: args.secret,
                            events: args.events,
                            filters: args.filters,
                            active: true,
                            deliveryCount: 0,
                            failureCount: 0,
                            createdBy: args.createdBy,
                        })];
                case 1:
                    webhookId = _a.sent();
                    return [2 /*return*/, { webhookId: webhookId }];
            }
        });
    }); },
});
exports.update = (0, server_1.mutation)({
    args: {
        webhookId: values_1.v.id("webhooks"),
        name: values_1.v.optional(values_1.v.string()),
        url: values_1.v.optional(values_1.v.string()),
        secret: values_1.v.optional(values_1.v.string()),
        events: values_1.v.optional(values_1.v.array(values_1.v.string())),
        filters: values_1.v.optional(values_1.v.object({
            taskTypes: values_1.v.optional(values_1.v.array(values_1.v.string())),
            agentIds: values_1.v.optional(values_1.v.array(values_1.v.id("agents"))),
            statuses: values_1.v.optional(values_1.v.array(values_1.v.string())),
        })),
        active: values_1.v.optional(values_1.v.boolean()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var webhookId, updates;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    webhookId = args.webhookId, updates = __rest(args, ["webhookId"]);
                    // Validate URL if provided
                    if (updates.url) {
                        try {
                            new URL(updates.url);
                        }
                        catch (_b) {
                            throw new Error("Invalid URL");
                        }
                    }
                    return [4 /*yield*/, ctx.db.patch(webhookId, updates)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
exports.remove = (0, server_1.mutation)({
    args: { webhookId: values_1.v.id("webhooks") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.delete(args.webhookId)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
// ============================================================================
// EVENT TRIGGERING
// ============================================================================
exports.triggerEvent = (0, server_1.internalMutation)({
    args: {
        event: values_1.v.string(),
        payload: values_1.v.any(),
        projectId: values_1.v.optional(values_1.v.id("projects")),
        taskId: values_1.v.optional(values_1.v.id("tasks")),
        agentId: values_1.v.optional(values_1.v.id("agents")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var webhooks, _i, webhooks_1, webhook, shouldDeliver;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("webhooks")
                        .withIndex("by_active", function (q) { return q.eq("active", true); })
                        .collect()];
                case 1:
                    webhooks = _a.sent();
                    // Filter by project
                    if (args.projectId) {
                        webhooks = webhooks.filter(function (w) { return !w.projectId || w.projectId === args.projectId; });
                    }
                    // Filter by event subscription
                    webhooks = webhooks.filter(function (w) { return w.events.includes(args.event); });
                    _i = 0, webhooks_1 = webhooks;
                    _a.label = 2;
                case 2:
                    if (!(_i < webhooks_1.length)) return [3 /*break*/, 5];
                    webhook = webhooks_1[_i];
                    shouldDeliver = true;
                    if (webhook.filters) {
                        // Filter by task type
                        if (webhook.filters.taskTypes && args.payload.taskType) {
                            shouldDeliver = webhook.filters.taskTypes.includes(args.payload.taskType);
                        }
                        // Filter by agent
                        if (webhook.filters.agentIds && args.agentId) {
                            shouldDeliver = shouldDeliver && webhook.filters.agentIds.includes(args.agentId);
                        }
                        // Filter by status
                        if (webhook.filters.statuses && args.payload.status) {
                            shouldDeliver = shouldDeliver && webhook.filters.statuses.includes(args.payload.status);
                        }
                    }
                    if (!shouldDeliver)
                        return [3 /*break*/, 4];
                    // Create delivery
                    return [4 /*yield*/, ctx.db.insert("webhookDeliveries", {
                            webhookId: webhook._id,
                            projectId: args.projectId,
                            event: args.event,
                            payload: args.payload,
                            url: webhook.url,
                            status: "PENDING",
                            attempts: 0,
                            maxAttempts: 3,
                        })];
                case 3:
                    // Create delivery
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    }); },
});
// ============================================================================
// DELIVERY (Actions) — uses Web Crypto for HMAC (no Node runtime)
// ============================================================================
exports.deliverPending = (0, server_1.action)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var deliveries, delivered, _i, deliveries_1, delivery, webhook, signature, response, responseBody, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.runMutation(api_1.internal.webhooks.getPendingDeliveries, {})];
                case 1:
                    deliveries = _a.sent();
                    delivered = 0;
                    _i = 0, deliveries_1 = deliveries;
                    _a.label = 2;
                case 2:
                    if (!(_i < deliveries_1.length)) return [3 /*break*/, 15];
                    delivery = deliveries_1[_i];
                    return [4 /*yield*/, ctx.runMutation(api_1.internal.webhooks.getWebhook, {
                            webhookId: delivery.webhookId,
                        })];
                case 3:
                    webhook = _a.sent();
                    if (!webhook)
                        return [3 /*break*/, 14];
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 12, , 14]);
                    return [4 /*yield*/, hmacSha256Hex(webhook.secret, JSON.stringify(delivery.payload))];
                case 5:
                    signature = _a.sent();
                    return [4 /*yield*/, fetch(delivery.url, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-Webhook-Signature": signature,
                                "X-Webhook-Event": delivery.event,
                                "User-Agent": "MissionControl-Webhooks/1.0",
                            },
                            body: JSON.stringify(delivery.payload),
                        })];
                case 6:
                    response = _a.sent();
                    return [4 /*yield*/, response.text()];
                case 7:
                    responseBody = _a.sent();
                    if (!response.ok) return [3 /*break*/, 9];
                    return [4 /*yield*/, ctx.runMutation(api_1.internal.webhooks.markDelivered, {
                            deliveryId: delivery._id,
                            webhookId: delivery.webhookId,
                            responseStatus: response.status,
                            responseBody: responseBody.substring(0, 1000),
                        })];
                case 8:
                    _a.sent();
                    delivered++;
                    return [3 /*break*/, 11];
                case 9: return [4 /*yield*/, ctx.runMutation(api_1.internal.webhooks.markFailed, {
                        deliveryId: delivery._id,
                        webhookId: delivery.webhookId,
                        responseStatus: response.status,
                        error: "HTTP ".concat(response.status, ": ").concat(responseBody.substring(0, 500)),
                    })];
                case 10:
                    _a.sent();
                    _a.label = 11;
                case 11: return [3 /*break*/, 14];
                case 12:
                    error_1 = _a.sent();
                    return [4 /*yield*/, ctx.runMutation(api_1.internal.webhooks.markFailed, {
                            deliveryId: delivery._id,
                            webhookId: delivery.webhookId,
                            error: error_1 instanceof Error ? error_1.message : "Unknown error",
                        })];
                case 13:
                    _a.sent();
                    return [3 /*break*/, 14];
                case 14:
                    _i++;
                    return [3 /*break*/, 2];
                case 15: return [2 /*return*/, { delivered: delivered }];
            }
        });
    }); },
});
exports.getPendingDeliveries = (0, server_1.internalMutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("webhookDeliveries")
                        .withIndex("by_status", function (q) { return q.eq("status", "PENDING"); })
                        .take(10)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.getWebhook = (0, server_1.internalMutation)({
    args: { webhookId: values_1.v.id("webhooks") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.webhookId)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.markDelivered = (0, server_1.internalMutation)({
    args: {
        deliveryId: values_1.v.id("webhookDeliveries"),
        webhookId: values_1.v.id("webhooks"),
        responseStatus: values_1.v.number(),
        responseBody: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var now, webhook;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = Date.now();
                    return [4 /*yield*/, ctx.db.patch(args.deliveryId, {
                            status: "DELIVERED",
                            responseStatus: args.responseStatus,
                            responseBody: args.responseBody,
                            deliveredAt: now,
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ctx.db.get(args.webhookId)];
                case 2:
                    webhook = _a.sent();
                    if (!webhook) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.patch(args.webhookId, {
                            deliveryCount: webhook.deliveryCount + 1,
                            lastDeliveryAt: now,
                        })];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    }); },
});
exports.markFailed = (0, server_1.internalMutation)({
    args: {
        deliveryId: values_1.v.id("webhookDeliveries"),
        webhookId: values_1.v.id("webhooks"),
        responseStatus: values_1.v.optional(values_1.v.number()),
        error: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var now, delivery, attempts, webhook, retryDelay, nextRetryAt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = Date.now();
                    return [4 /*yield*/, ctx.db.get(args.deliveryId)];
                case 1:
                    delivery = _a.sent();
                    if (!delivery)
                        return [2 /*return*/];
                    attempts = delivery.attempts + 1;
                    if (!(attempts >= delivery.maxAttempts)) return [3 /*break*/, 6];
                    // Max retries reached
                    return [4 /*yield*/, ctx.db.patch(args.deliveryId, {
                            status: "FAILED",
                            attempts: attempts,
                            responseStatus: args.responseStatus,
                            error: args.error,
                        })];
                case 2:
                    // Max retries reached
                    _a.sent();
                    return [4 /*yield*/, ctx.db.get(args.webhookId)];
                case 3:
                    webhook = _a.sent();
                    if (!webhook) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.db.patch(args.webhookId, {
                            failureCount: webhook.failureCount + 1,
                            lastFailureAt: now,
                        })];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [3 /*break*/, 8];
                case 6:
                    retryDelay = Math.pow(2, attempts) * 1000;
                    nextRetryAt = now + retryDelay;
                    return [4 /*yield*/, ctx.db.patch(args.deliveryId, {
                            status: "RETRYING",
                            attempts: attempts,
                            nextRetryAt: nextRetryAt,
                            responseStatus: args.responseStatus,
                            error: args.error,
                        })];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8: return [2 /*return*/];
            }
        });
    }); },
});

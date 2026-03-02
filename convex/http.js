"use strict";
/**
 * Convex HTTP Routes — Stripe webhooks and external integrations
 *
 * Stripe webhook signature is verified with STRIPE_WEBHOOK_SECRET (whsec_...) when set.
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
var server_1 = require("convex/server");
var server_2 = require("./_generated/server");
var api_1 = require("./_generated/api");
var http = (0, server_1.httpRouter)();
/**
 * Verify Stripe-Signature header (HMAC-SHA256) using Web Crypto.
 * Header format: "t=timestamp,v1=hex_signature[,v0=...]"
 * Signed payload: "${timestamp}.${rawBody}"
 */
function verifyStripeSignature(rawBody, signatureHeader, secret) {
    return __awaiter(this, void 0, void 0, function () {
        var parts, timestamp, v1, signedPayload, enc, key, sig, expected, eq, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!signatureHeader || !secret)
                        return [2 /*return*/, false];
                    parts = signatureHeader.split(",").reduce(function (acc, part) {
                        var _a = part.split("="), k = _a[0], v = _a[1];
                        if (k && v)
                            acc[k.trim()] = v.trim();
                        return acc;
                    }, {});
                    timestamp = parts["t"];
                    v1 = parts["v1"];
                    if (!timestamp || !v1)
                        return [2 /*return*/, false];
                    signedPayload = "".concat(timestamp, ".").concat(rawBody);
                    enc = new TextEncoder();
                    return [4 /*yield*/, crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])];
                case 1:
                    key = _a.sent();
                    return [4 /*yield*/, crypto.subtle.sign("HMAC", key, enc.encode(signedPayload))];
                case 2:
                    sig = _a.sent();
                    expected = Array.from(new Uint8Array(sig))
                        .map(function (b) { return b.toString(16).padStart(2, "0"); })
                        .join("");
                    if (v1.length !== expected.length)
                        return [2 /*return*/, false];
                    eq = true;
                    for (i = 0; i < v1.length; i++) {
                        if (v1[i] !== expected[i])
                            eq = false;
                    }
                    return [2 /*return*/, eq];
            }
        });
    });
}
http.route({
    path: "/stripe/webhook",
    method: "POST",
    handler: (0, server_2.httpAction)(function (ctx, request) { return __awaiter(void 0, void 0, void 0, function () {
        var body, signature, secret, valid, event, obj, typeMap, eventType, amount, currency;
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0: return [4 /*yield*/, request.text()];
                case 1:
                    body = _j.sent();
                    signature = request.headers.get("stripe-signature");
                    secret = process.env.STRIPE_WEBHOOK_SECRET;
                    if (!secret) return [3 /*break*/, 3];
                    return [4 /*yield*/, verifyStripeSignature(body, signature, secret)];
                case 2:
                    valid = _j.sent();
                    if (!valid) {
                        return [2 /*return*/, new Response("Webhook signature verification failed", { status: 401 })];
                    }
                    _j.label = 3;
                case 3:
                    try {
                        event = JSON.parse(body);
                    }
                    catch (_k) {
                        return [2 /*return*/, new Response("Invalid JSON", { status: 400 })];
                    }
                    obj = (_a = event.data) === null || _a === void 0 ? void 0 : _a.object;
                    if (!obj) {
                        return [2 /*return*/, new Response("Missing event data", { status: 400 })];
                    }
                    typeMap = {
                        "charge.succeeded": "CHARGE",
                        "invoice.paid": "SUBSCRIPTION",
                        "charge.refunded": "REFUND",
                        "payout.paid": "PAYOUT",
                    };
                    eventType = typeMap[event.type];
                    if (!eventType) {
                        return [2 /*return*/, new Response("OK (ignored)", { status: 200 })];
                    }
                    amount = ((_c = (_b = obj.amount) !== null && _b !== void 0 ? _b : obj.amount_paid) !== null && _c !== void 0 ? _c : 0) / 100;
                    currency = ((_d = obj.currency) !== null && _d !== void 0 ? _d : "usd").toUpperCase();
                    return [4 /*yield*/, ctx.runMutation(api_1.api.revenue.record, {
                            source: "STRIPE",
                            eventType: eventType,
                            amount: amount,
                            currency: currency,
                            description: (_e = obj.description) !== null && _e !== void 0 ? _e : event.type,
                            customerId: (_f = obj.customer) !== null && _f !== void 0 ? _f : undefined,
                            customerEmail: (_h = (_g = obj.receipt_email) !== null && _g !== void 0 ? _g : obj.customer_email) !== null && _h !== void 0 ? _h : undefined,
                            externalId: event.id,
                            externalRef: obj.id,
                        })];
                case 4:
                    _j.sent();
                    return [2 /*return*/, new Response("OK", { status: 200 })];
            }
        });
    }); }),
});
exports.default = http;

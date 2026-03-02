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
exports.parseEnvelopeDecision = parseEnvelopeDecision;
exports.evaluatePolicyEnvelopes = evaluatePolicyEnvelopes;
function parseEnvelopeDecision(envelopeRules, toolName, risk) {
    if (!envelopeRules)
        return null;
    if (toolName && envelopeRules.toolPolicies && typeof envelopeRules.toolPolicies === "object") {
        var rule = envelopeRules.toolPolicies[toolName];
        if (rule === "ALLOW" || rule === "DENY" || rule === "NEEDS_APPROVAL") {
            return rule;
        }
    }
    if (Array.isArray(envelopeRules.requireApprovalOnRisk) && risk) {
        if (envelopeRules.requireApprovalOnRisk.includes(risk)) {
            return "NEEDS_APPROVAL";
        }
    }
    if (envelopeRules.defaultDecision === "ALLOW" ||
        envelopeRules.defaultDecision === "DENY" ||
        envelopeRules.defaultDecision === "NEEDS_APPROVAL") {
        return envelopeRules.defaultDecision;
    }
    return null;
}
function evaluatePolicyEnvelopes(db, args) {
    return __awaiter(this, void 0, void 0, function () {
        var candidates, rows, rows, rows, _i, candidates_1, scope, active, _a, active_1, envelope, decision;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    candidates = [];
                    if (!args.versionId) return [3 /*break*/, 2];
                    return [4 /*yield*/, db
                            .query("policyEnvelopes")
                            .withIndex("by_version", function (q) { return q.eq("versionId", args.versionId); })
                            .collect()];
                case 1:
                    rows = _b.sent();
                    candidates.push({ source: "version", rows: rows });
                    _b.label = 2;
                case 2:
                    if (!args.projectId) return [3 /*break*/, 4];
                    return [4 /*yield*/, db
                            .query("policyEnvelopes")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 3:
                    rows = _b.sent();
                    candidates.push({ source: "project", rows: rows });
                    _b.label = 4;
                case 4:
                    if (!args.tenantId) return [3 /*break*/, 6];
                    return [4 /*yield*/, db
                            .query("policyEnvelopes")
                            .withIndex("by_tenant", function (q) { return q.eq("tenantId", args.tenantId); })
                            .collect()];
                case 5:
                    rows = _b.sent();
                    candidates.push({ source: "tenant", rows: rows });
                    _b.label = 6;
                case 6:
                    for (_i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
                        scope = candidates_1[_i];
                        active = scope.rows
                            .filter(function (row) { return row.active; })
                            .sort(function (a, b) { var _a, _b; return ((_a = b.priority) !== null && _a !== void 0 ? _a : 0) - ((_b = a.priority) !== null && _b !== void 0 ? _b : 0); });
                        for (_a = 0, active_1 = active; _a < active_1.length; _a++) {
                            envelope = active_1[_a];
                            decision = parseEnvelopeDecision(envelope.rules, args.toolName, args.riskLevel);
                            if (decision) {
                                return [2 /*return*/, {
                                        decision: decision,
                                        reason: "Policy envelope '".concat(envelope.name, "' (").concat(scope.source, ") returned ").concat(decision),
                                        source: scope.source,
                                        envelope: envelope,
                                    }];
                            }
                        }
                    }
                    return [2 /*return*/, null];
            }
        });
    });
}

"use strict";
/**
 * Squad Deployment — One-click agent provisioning from predefined personas
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
exports.deploySquad = exports.getPersonas = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var SQUAD_PERSONAS = [
    { name: "Coordinator", emoji: "🧠", role: "CEO", allowedTaskTypes: ["OPS", "ENGINEERING", "CONTENT", "SOCIAL", "CUSTOMER_RESEARCH"], budgetDaily: 15.0, budgetPerRun: 2.0 },
    { name: "Coder", emoji: "💻", role: "SPECIALIST", allowedTaskTypes: ["ENGINEERING"], budgetDaily: 5.0, budgetPerRun: 0.75 },
    { name: "Research", emoji: "🔬", role: "SPECIALIST", allowedTaskTypes: ["CUSTOMER_RESEARCH", "SEO_RESEARCH"], budgetDaily: 5.0, budgetPerRun: 0.75 },
    { name: "Designer", emoji: "🎨", role: "SPECIALIST", allowedTaskTypes: ["CONTENT", "DOCS"], budgetDaily: 5.0, budgetPerRun: 0.75 },
    { name: "Storyteller", emoji: "📝", role: "SPECIALIST", allowedTaskTypes: ["CONTENT", "SOCIAL"], budgetDaily: 5.0, budgetPerRun: 0.75 },
    { name: "QA", emoji: "🧪", role: "SPECIALIST", allowedTaskTypes: ["ENGINEERING"], budgetDaily: 5.0, budgetPerRun: 0.75 },
    { name: "Operations", emoji: "⚙️", role: "LEAD", allowedTaskTypes: ["OPS", "ENGINEERING"], budgetDaily: 12.0, budgetPerRun: 1.5 },
    { name: "Strategist", emoji: "📊", role: "LEAD", allowedTaskTypes: ["CUSTOMER_RESEARCH", "SEO_RESEARCH", "OPS"], budgetDaily: 12.0, budgetPerRun: 1.5 },
    { name: "Finance", emoji: "💰", role: "SPECIALIST", allowedTaskTypes: ["OPS"], budgetDaily: 5.0, budgetPerRun: 0.75 },
    { name: "Compliance", emoji: "🛡️", role: "SPECIALIST", allowedTaskTypes: ["OPS", "DOCS"], budgetDaily: 5.0, budgetPerRun: 0.75 },
    { name: "Learner", emoji: "📚", role: "INTERN", allowedTaskTypes: ["CUSTOMER_RESEARCH", "SEO_RESEARCH", "DOCS"], budgetDaily: 2.0, budgetPerRun: 0.25 },
    { name: "BJ", emoji: "🤖", role: "SPECIALIST", allowedTaskTypes: ["ENGINEERING", "CONTENT", "OPS"], budgetDaily: 5.0, budgetPerRun: 0.75 },
    { name: "Sofie", emoji: "✨", role: "SPECIALIST", allowedTaskTypes: ["CONTENT", "SOCIAL", "EMAIL_MARKETING"], budgetDaily: 5.0, budgetPerRun: 0.75 },
];
exports.getPersonas = (0, server_1.query)({
    args: {},
    handler: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, SQUAD_PERSONAS];
        });
    }); },
});
exports.deploySquad = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var project, _a, deployed, skipped, _loop_1, _i, SQUAD_PERSONAS_1, persona;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db.get(args.projectId)];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = null;
                    _b.label = 3;
                case 3:
                    project = _a;
                    deployed = [];
                    skipped = [];
                    _loop_1 = function (persona) {
                        var existing, agentId;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0: return [4 /*yield*/, ctx.db
                                        .query("agents")
                                        .withIndex("by_name", function (q) { return q.eq("name", persona.name); })
                                        .first()];
                                case 1:
                                    existing = _c.sent();
                                    if (!existing) return [3 /*break*/, 5];
                                    if (!(existing.status === "QUARANTINED" || existing.status === "OFFLINE")) return [3 /*break*/, 3];
                                    return [4 /*yield*/, ctx.db.patch(existing._id, {
                                            status: "ACTIVE",
                                            lastHeartbeatAt: Date.now(),
                                            errorStreak: 0,
                                        })];
                                case 2:
                                    _c.sent();
                                    deployed.push(persona.name);
                                    return [3 /*break*/, 4];
                                case 3:
                                    skipped.push(persona.name);
                                    _c.label = 4;
                                case 4: return [2 /*return*/, "continue"];
                                case 5: return [4 /*yield*/, ctx.db.insert("agents", {
                                        tenantId: project === null || project === void 0 ? void 0 : project.tenantId,
                                        projectId: args.projectId,
                                        name: persona.name,
                                        emoji: persona.emoji,
                                        role: persona.role,
                                        status: "ACTIVE",
                                        workspacePath: "/agents/".concat(persona.name.toLowerCase()),
                                        allowedTaskTypes: persona.allowedTaskTypes,
                                        budgetDaily: persona.budgetDaily,
                                        budgetPerRun: persona.budgetPerRun,
                                        spendToday: 0,
                                        canSpawn: persona.role === "CEO" || persona.role === "LEAD",
                                        maxSubAgents: persona.role === "CEO" ? 5 : persona.role === "LEAD" ? 2 : 0,
                                        errorStreak: 0,
                                        lastHeartbeatAt: Date.now(),
                                    })];
                                case 6:
                                    agentId = _c.sent();
                                    return [4 /*yield*/, ctx.db.insert("activities", {
                                            projectId: args.projectId,
                                            actorType: "SYSTEM",
                                            action: "AGENT_DEPLOYED",
                                            description: "Agent \"".concat(persona.name, "\" ").concat(persona.emoji, " deployed via Squad Deploy"),
                                            targetType: "AGENT",
                                            targetId: agentId,
                                            agentId: agentId,
                                        })];
                                case 7:
                                    _c.sent();
                                    deployed.push(persona.name);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, SQUAD_PERSONAS_1 = SQUAD_PERSONAS;
                    _b.label = 4;
                case 4:
                    if (!(_i < SQUAD_PERSONAS_1.length)) return [3 /*break*/, 7];
                    persona = SQUAD_PERSONAS_1[_i];
                    return [5 /*yield**/, _loop_1(persona)];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7: return [4 /*yield*/, ctx.db.insert("activities", {
                        projectId: args.projectId,
                        actorType: "HUMAN",
                        actorId: "operator",
                        action: "SQUAD_DEPLOYED",
                        description: "Squad deployed: ".concat(deployed.length, " agents activated, ").concat(skipped.length, " already running"),
                    })];
                case 8:
                    _b.sent();
                    return [2 /*return*/, { deployed: deployed, skipped: skipped, total: SQUAD_PERSONAS.length }];
            }
        });
    }); },
});

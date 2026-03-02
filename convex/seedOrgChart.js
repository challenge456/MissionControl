"use strict";
/**
 * Seed org chart with sample humans and agents
 * Run: npx convex run seedOrgChart:run
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
exports.clear = exports.run = void 0;
var server_1 = require("./_generated/server");
exports.run = (0, server_1.mutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var projectId, existingProject, ceoId, csoAgentId, codexAgentId, glmAgentId, glmFlashAgentId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("projects")
                        .withIndex("by_slug", function (q) { return q.eq("slug", "mission-control"); })
                        .first()];
                case 1:
                    existingProject = _a.sent();
                    if (!existingProject) return [3 /*break*/, 2];
                    console.log("Using existing Mission Control project:", existingProject._id);
                    projectId = existingProject._id;
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.insert("projects", {
                        name: "Mission Control",
                        slug: "mission-control",
                        description: "Self-hosted orchestration platform for AI agent squads",
                    })];
                case 3:
                    projectId = _a.sent();
                    console.log("Created Mission Control project:", projectId);
                    _a.label = 4;
                case 4: return [4 /*yield*/, ctx.db.insert("orgMembers", {
                        projectId: projectId,
                        name: "Alex Finn",
                        role: "Chief Executive Officer",
                        avatar: "👤",
                        level: 0,
                        active: true,
                        responsibilities: [
                            "Vision & Strategy",
                            "Content Creation",
                            "Business Development",
                            "Final Decisions",
                        ],
                    })];
                case 5:
                    ceoId = _a.sent();
                    console.log("Created CEO:", ceoId);
                    return [4 /*yield*/, ctx.db.insert("agents", {
                            projectId: projectId,
                            name: "Henry",
                            emoji: "🤖",
                            role: "LEAD",
                            status: "ACTIVE",
                            workspacePath: "/agents/henry",
                            allowedTaskTypes: ["ENGINEERING", "DOCS", "OPS"],
                            budgetDaily: 100,
                            budgetPerRun: 5,
                            spendToday: 25,
                            canSpawn: true,
                            maxSubAgents: 5,
                            errorStreak: 0,
                            lastHeartbeatAt: Date.now(),
                            metadata: {
                                model: "Claude Opus 4.5",
                                description: "Chief Strategy Officer",
                                capabilities: [
                                    "Strategic Planning",
                                    "Task Orchestration",
                                    "Complex Reasoning",
                                    "Writing & Analysis",
                                ],
                            },
                        })];
                case 6:
                    csoAgentId = _a.sent();
                    console.log("Created CSO Agent (Henry):", csoAgentId);
                    return [4 /*yield*/, ctx.db.insert("agents", {
                            projectId: projectId,
                            name: "Codex",
                            emoji: "💻",
                            role: "SPECIALIST",
                            status: "ACTIVE",
                            workspacePath: "/agents/codex",
                            allowedTaskTypes: ["ENGINEERING"],
                            budgetDaily: 50,
                            budgetPerRun: 2,
                            spendToday: 10,
                            canSpawn: false,
                            maxSubAgents: 0,
                            parentAgentId: csoAgentId,
                            errorStreak: 0,
                            lastHeartbeatAt: Date.now(),
                            metadata: {
                                model: "GPT-5.2 Codex",
                                description: "Lead Software Engineer",
                                capabilities: [
                                    "Full Stack Development",
                                    "Code Review",
                                    "Architecture",
                                    "API (OpenAI)",
                                ],
                            },
                        })];
                case 7:
                    codexAgentId = _a.sent();
                    console.log("Created Codex Agent:", codexAgentId);
                    return [4 /*yield*/, ctx.db.insert("agents", {
                            projectId: projectId,
                            name: "GLM-4.7",
                            emoji: "🔬",
                            role: "SPECIALIST",
                            status: "ACTIVE",
                            workspacePath: "/agents/glm",
                            allowedTaskTypes: ["CUSTOMER_RESEARCH", "SEO_RESEARCH"],
                            budgetDaily: 0, // Local model
                            budgetPerRun: 0,
                            spendToday: 0,
                            canSpawn: false,
                            maxSubAgents: 0,
                            parentAgentId: csoAgentId,
                            errorStreak: 0,
                            lastHeartbeatAt: Date.now(),
                            metadata: {
                                model: "GLM-4.7",
                                description: "Senior Research Analyst",
                                capabilities: [
                                    "Deep Research",
                                    "Code Generation",
                                    "Document Analysis",
                                    "Parallel Processing",
                                ],
                                parameters: "35M Parameters • Local",
                                inference: "$0 (local inference)",
                            },
                        })];
                case 8:
                    glmAgentId = _a.sent();
                    console.log("Created GLM Agent:", glmAgentId);
                    return [4 /*yield*/, ctx.db.insert("agents", {
                            projectId: projectId,
                            name: "GLM-4.7 Flash",
                            emoji: "⚡",
                            role: "INTERN",
                            status: "ACTIVE",
                            workspacePath: "/agents/glm-flash",
                            allowedTaskTypes: ["CONTENT", "SOCIAL"],
                            budgetDaily: 0, // Local model
                            budgetPerRun: 0,
                            spendToday: 0,
                            canSpawn: false,
                            maxSubAgents: 0,
                            parentAgentId: csoAgentId,
                            errorStreak: 0,
                            lastHeartbeatAt: Date.now(),
                            metadata: {
                                model: "GLM-4.7 Flash",
                                description: "Research Associate",
                                capabilities: [
                                    "Quick Lookups",
                                    "Drafting",
                                    "Brainstorming",
                                    "High-Volume Tasks",
                                ],
                                parameters: "3M MoE • Local",
                                inference: "$0 (local inference)",
                            },
                        })];
                case 9:
                    glmFlashAgentId = _a.sent();
                    console.log("Created GLM Flash Agent:", glmFlashAgentId);
                    console.log("\n✅ Org chart seeded successfully!");
                    console.log("Structure:");
                    console.log("  👤 Alex Finn (CEO)");
                    console.log("    └─ 🤖 Henry (CSO Agent)");
                    console.log("        ├─ 💻 Codex (Lead Engineer)");
                    console.log("        ├─ 🔬 GLM-4.7 (Senior Researcher)");
                    console.log("        └─ ⚡ GLM-4.7 Flash (Research Associate)");
                    return [2 /*return*/, {
                            projectId: projectId,
                            ceoId: ceoId,
                            csoAgentId: csoAgentId,
                            subAgents: [codexAgentId, glmAgentId, glmFlashAgentId],
                        }];
            }
        });
    }); },
});
/**
 * Clear all org members and agents (for testing)
 */
exports.clear = (0, server_1.mutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var members, _i, members_1, member, agents, _a, agents_1, agent;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.query("orgMembers").collect()];
                case 1:
                    members = _b.sent();
                    _i = 0, members_1 = members;
                    _b.label = 2;
                case 2:
                    if (!(_i < members_1.length)) return [3 /*break*/, 5];
                    member = members_1[_i];
                    return [4 /*yield*/, ctx.db.delete(member._id)];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [4 /*yield*/, ctx.db.query("agents").collect()];
                case 6:
                    agents = _b.sent();
                    _a = 0, agents_1 = agents;
                    _b.label = 7;
                case 7:
                    if (!(_a < agents_1.length)) return [3 /*break*/, 10];
                    agent = agents_1[_a];
                    return [4 /*yield*/, ctx.db.delete(agent._id)];
                case 8:
                    _b.sent();
                    _b.label = 9;
                case 9:
                    _a++;
                    return [3 /*break*/, 7];
                case 10:
                    console.log("Deleted ".concat(members.length, " org members and ").concat(agents.length, " agents"));
                    return [2 /*return*/, { deleted: members.length + agents.length }];
            }
        });
    }); },
});

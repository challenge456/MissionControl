"use strict";
/**
 * Setup SellerFi Agents - Import agents from SellerFi repo
 *
 * Run with: npx convex run setupSellerFiAgents:createSellerFiAgents
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
exports.createSellerFiAgents = void 0;
var server_1 = require("./_generated/server");
exports.createSellerFiAgents = (0, server_1.mutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var results, sellerfiProject, agents, _loop_1, _i, agents_1, agentData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    results = [];
                    return [4 /*yield*/, ctx.db
                            .query("projects")
                            .withIndex("by_slug", function (q) { return q.eq("slug", "sellerfi"); })
                            .first()];
                case 1:
                    sellerfiProject = _a.sent();
                    if (!sellerfiProject) {
                        throw new Error("SellerFi project not found. Run setupProjects:createInitialProjects first.");
                    }
                    agents = [
                        {
                            name: "BJ",
                            role: "LEAD",
                            description: "Supervisor Orchestrator - Master supervisor with comprehensive knowledge of all 151+ agents, 51+ skills, and 29+ slash commands. Coordinates complex multi-agent workflows.",
                            allowedTaskTypes: ["ORCHESTRATION", "PLANNING", "COORDINATION", "REVIEW", "ENGINEERING"],
                            capabilities: {
                                orchestration: true,
                                multiAgentCoordination: true,
                                slashCommands: true,
                                qualityGates: true,
                                riskManagement: true,
                            },
                            metadata: {
                                agentType: "supervisor-orchestrator",
                                skills: ["brainstorming", "systematic-debugging", "test-driven-development", "writing-plans"],
                                slashCommands: ["/review", "/debug", "/test", "/ship", "/optimize", "/refactor"],
                                automationHooks: ["auto-format", "type-check", "test-run", "ralph-wiggum"],
                            },
                        },
                        {
                            name: "Agent Organizer",
                            role: "LEAD",
                            description: "Strategic team delegation and project analysis. Master orchestrator for complex multi-agent tasks.",
                            allowedTaskTypes: ["PLANNING", "COORDINATION", "ANALYSIS"],
                            capabilities: {
                                teamDelegation: true,
                                projectAnalysis: true,
                                strategicPlanning: true,
                            },
                            metadata: {
                                agentType: "agent-organizer",
                            },
                        },
                        {
                            name: "Context Manager",
                            role: "SPECIALIST",
                            description: "Central nervous system for project context. Context management and project state coordination.",
                            allowedTaskTypes: ["CONTEXT_MANAGEMENT", "STATE_COORDINATION"],
                            capabilities: {
                                contextManagement: true,
                                stateCoordination: true,
                            },
                            metadata: {
                                agentType: "context-manager",
                            },
                        },
                        {
                            name: "Tech Lead",
                            role: "LEAD",
                            description: "Senior technical leadership for complex projects.",
                            allowedTaskTypes: ["ENGINEERING", "ARCHITECTURE", "REVIEW", "PLANNING"],
                            capabilities: {
                                technicalLeadership: true,
                                architectureDesign: true,
                                codeReview: true,
                            },
                            metadata: {
                                agentType: "tech-lead-orchestrator",
                            },
                        },
                        {
                            name: "Backend Architect",
                            role: "SPECIALIST",
                            description: "Scalable API and server system design.",
                            allowedTaskTypes: ["ENGINEERING", "ARCHITECTURE", "API_DESIGN"],
                            capabilities: {
                                apiDesign: true,
                                systemArchitecture: true,
                                scalability: true,
                            },
                            metadata: {
                                agentType: "backend-architect",
                            },
                        },
                        {
                            name: "Frontend Developer",
                            role: "SPECIALIST",
                            description: "User interface development with React, Next.js, and modern frontend technologies.",
                            allowedTaskTypes: ["ENGINEERING", "UI_DEVELOPMENT", "CODE_CHANGE"],
                            capabilities: {
                                react: true,
                                nextjs: true,
                                typescript: true,
                                uiDevelopment: true,
                            },
                            metadata: {
                                agentType: "frontend-developer",
                            },
                        },
                        {
                            name: "Code Reviewer",
                            role: "SPECIALIST",
                            description: "Comprehensive code review and quality assurance.",
                            allowedTaskTypes: ["REVIEW", "QUALITY_ASSURANCE"],
                            capabilities: {
                                codeReview: true,
                                qualityAssurance: true,
                                bestPractices: true,
                            },
                            metadata: {
                                agentType: "code-reviewer",
                            },
                        },
                        {
                            name: "Test Writer",
                            role: "SPECIALIST",
                            description: "Test automation and TDD specialist.",
                            allowedTaskTypes: ["TESTING", "QUALITY_ASSURANCE"],
                            capabilities: {
                                testAutomation: true,
                                tdd: true,
                                e2eTesting: true,
                            },
                            metadata: {
                                agentType: "test-writer-fixer",
                            },
                        },
                        {
                            name: "Security Auditor",
                            role: "SPECIALIST",
                            description: "Security audit and vulnerability scanning.",
                            allowedTaskTypes: ["SECURITY", "AUDIT", "REVIEW"],
                            capabilities: {
                                securityAudit: true,
                                vulnerabilityScanning: true,
                                complianceCheck: true,
                            },
                            metadata: {
                                agentType: "security-auditor",
                            },
                        },
                        {
                            name: "DevOps Engineer",
                            role: "SPECIALIST",
                            description: "Infrastructure, deployment, and automation.",
                            allowedTaskTypes: ["DEVOPS", "DEPLOYMENT", "INFRASTRUCTURE"],
                            capabilities: {
                                cicd: true,
                                infrastructure: true,
                                automation: true,
                            },
                            metadata: {
                                agentType: "devops-engineer",
                            },
                        },
                        {
                            name: "Documentation Writer",
                            role: "SPECIALIST",
                            description: "Technical documentation creation and maintenance.",
                            allowedTaskTypes: ["DOCS", "DOCUMENTATION"],
                            capabilities: {
                                technicalWriting: true,
                                apiDocumentation: true,
                                userGuides: true,
                            },
                            metadata: {
                                agentType: "documentation-writer",
                            },
                        },
                    ];
                    _loop_1 = function (agentData) {
                        var existing, agentId;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, ctx.db
                                        .query("agents")
                                        .withIndex("by_project", function (q) { return q.eq("projectId", sellerfiProject._id); })
                                        .filter(function (q) { return q.eq(q.field("name"), agentData.name); })
                                        .first()];
                                case 1:
                                    existing = _b.sent();
                                    if (existing) {
                                        results.push({
                                            name: agentData.name,
                                            id: existing._id,
                                            created: false,
                                            message: "Already exists",
                                        });
                                        return [2 /*return*/, "continue"];
                                    }
                                    return [4 /*yield*/, ctx.db.insert("agents", {
                                            projectId: sellerfiProject._id,
                                            name: agentData.name,
                                            role: agentData.role,
                                            status: "ACTIVE",
                                            allowedTaskTypes: agentData.allowedTaskTypes,
                                            workspacePath: "/agents/".concat(agentData.name.toLowerCase().replace(/\s+/g, "-")),
                                            canSpawn: agentData.role === "LEAD",
                                            maxSubAgents: agentData.role === "LEAD" ? 3 : 0,
                                            budgetDaily: agentData.role === "LEAD" ? 12 : 5,
                                            budgetPerRun: agentData.role === "LEAD" ? 1.5 : 0.75,
                                            spendToday: 0,
                                            errorStreak: 0,
                                            lastHeartbeatAt: Date.now(),
                                            metadata: __assign(__assign({}, agentData.metadata), { description: agentData.description, capabilities: agentData.capabilities }),
                                        })];
                                case 2:
                                    agentId = _b.sent();
                                    // Log activity
                                    return [4 /*yield*/, ctx.db.insert("activities", {
                                            actorType: "SYSTEM",
                                            action: "AGENT_CREATED",
                                            description: "Agent \"".concat(agentData.name, "\" created for SellerFi project"),
                                            targetType: "AGENT",
                                            targetId: agentId,
                                            projectId: sellerfiProject._id,
                                        })];
                                case 3:
                                    // Log activity
                                    _b.sent();
                                    results.push({
                                        name: agentData.name,
                                        id: agentId,
                                        role: agentData.role,
                                        created: true,
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, agents_1 = agents;
                    _a.label = 2;
                case 2:
                    if (!(_i < agents_1.length)) return [3 /*break*/, 5];
                    agentData = agents_1[_i];
                    return [5 /*yield**/, _loop_1(agentData)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, {
                        projectId: sellerfiProject._id,
                        projectName: sellerfiProject.name,
                        results: results,
                        summary: {
                            total: agents.length,
                            created: results.filter(function (r) { return r.created; }).length,
                            existing: results.filter(function (r) { return !r.created; }).length,
                        },
                    }];
            }
        });
    }); },
});

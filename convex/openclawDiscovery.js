"use strict";
/**
 * OpenClaw Agent Discovery
 *
 * Discover agents from an OpenClaw Gateway and import them into the registry.
 * Gateway URL: canonical source is gatewayConnection table (set in UI Gateway settings);
 * fallback is OPENCLAW_GATEWAY_URL in Convex env. Token: OPENCLAW_GATEWAY_TOKEN or
 * GATEWAY_TOKEN in Convex env (same as orchestration server).
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
exports.importAgent = exports.discoverAgents = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var api_1 = require("./_generated/api");
/**
 * Call the OpenClaw Gateway to list running agents.
 * URL: gatewayConnection table (canonical) then OPENCLAW_GATEWAY_URL env.
 * Token: OPENCLAW_GATEWAY_TOKEN or GATEWAY_TOKEN in Convex env.
 * Tries GET {baseUrl}/agents and GET {baseUrl}/api/agents.
 */
exports.discoverAgents = (0, server_1.action)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var conn, baseUrl, token, url, candidates, headers, _i, candidates_1, endpoint, res, data, list, agents, _a;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, ctx.runQuery(api_1.api.gatewayConnection.get, {})];
                case 1:
                    conn = _e.sent();
                    baseUrl = ((_b = conn === null || conn === void 0 ? void 0 : conn.url) === null || _b === void 0 ? void 0 : _b.trim()) || process.env.OPENCLAW_GATEWAY_URL || "";
                    token = ((_c = process.env.OPENCLAW_GATEWAY_TOKEN) === null || _c === void 0 ? void 0 : _c.trim()) ||
                        ((_d = process.env.GATEWAY_TOKEN) === null || _d === void 0 ? void 0 : _d.trim()) ||
                        "";
                    if (!baseUrl || !baseUrl.startsWith("http")) {
                        return [2 /*return*/, {
                                agents: [],
                                error: "Gateway URL is not set. Set it in Mission Control Gateway settings or OPENCLAW_GATEWAY_URL in Convex env (e.g. http://localhost:18789).",
                            }];
                    }
                    url = baseUrl.replace(/\/$/, "");
                    candidates = ["".concat(url, "/agents"), "".concat(url, "/api/agents"), "".concat(url, "/api/v1/agents")];
                    headers = {
                        "Content-Type": "application/json",
                    };
                    if (token) {
                        headers["Authorization"] = "Bearer ".concat(token);
                    }
                    _i = 0, candidates_1 = candidates;
                    _e.label = 2;
                case 2:
                    if (!(_i < candidates_1.length)) return [3 /*break*/, 8];
                    endpoint = candidates_1[_i];
                    _e.label = 3;
                case 3:
                    _e.trys.push([3, 6, , 7]);
                    return [4 /*yield*/, fetch(endpoint, { method: "GET", headers: headers })];
                case 4:
                    res = _e.sent();
                    if (!res.ok)
                        return [3 /*break*/, 7];
                    return [4 /*yield*/, res.json()];
                case 5:
                    data = (_e.sent());
                    list = Array.isArray(data)
                        ? data
                        : Array.isArray(data.agents)
                            ? data.agents
                            : Array.isArray(data.data)
                                ? data.data
                                : [];
                    agents = list.map(function (item) {
                        var _a, _b, _c, _d, _e;
                        return ({
                            id: String((_c = (_b = (_a = item.id) !== null && _a !== void 0 ? _a : item.agentId) !== null && _b !== void 0 ? _b : item.name) !== null && _c !== void 0 ? _c : ""),
                            name: String((_e = (_d = item.name) !== null && _d !== void 0 ? _d : item.id) !== null && _e !== void 0 ? _e : "Unknown"),
                            alias: item.alias ? String(item.alias) : undefined,
                            status: item.status ? String(item.status) : undefined,
                            capabilities: Array.isArray(item.capabilities)
                                ? item.capabilities.map(String)
                                : Array.isArray(item.allowedTaskTypes)
                                    ? item.allowedTaskTypes.map(String)
                                    : undefined,
                            description: item.description ? String(item.description) : undefined,
                        });
                    }).filter(function (a) { return a.id && a.name; });
                    return [2 /*return*/, { agents: agents }];
                case 6:
                    _a = _e.sent();
                    return [3 /*break*/, 7];
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8: return [2 /*return*/, {
                        agents: [],
                        error: "Gateway did not respond with an agents list. Ensure the gateway exposes GET /agents or GET /api/agents.",
                    }];
            }
        });
    }); },
});
/**
 * Import a discovered agent into the Mission Control registry.
 * Creates an agent with metadata.source = OPENCLAW_GATEWAY.
 */
exports.importAgent = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        discovered: values_1.v.object({
            id: values_1.v.string(),
            name: values_1.v.string(),
            alias: values_1.v.optional(values_1.v.string()),
            status: values_1.v.optional(values_1.v.string()),
            capabilities: values_1.v.optional(values_1.v.array(values_1.v.string())),
            description: values_1.v.optional(values_1.v.string()),
        }),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var name, workspacePath, allowedTaskTypes, project, _a, budgetDaily, budgetPerRun, agentId, agent;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    name = args.discovered.name.trim() || args.discovered.id;
                    workspacePath = "/gateway/agents/".concat(((_b = args.discovered.alias) !== null && _b !== void 0 ? _b : args.discovered.id).replace(/\s+/g, "-").toLowerCase());
                    allowedTaskTypes = ((_c = args.discovered.capabilities) === null || _c === void 0 ? void 0 : _c.length)
                        ? args.discovered.capabilities
                        : ["ENGINEERING", "DOCS", "OPS", "CONTENT"];
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db.get(args.projectId)];
                case 1:
                    _a = _d.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = null;
                    _d.label = 3;
                case 3:
                    project = _a;
                    budgetDaily = 5.0;
                    budgetPerRun = 0.75;
                    return [4 /*yield*/, ctx.db.insert("agents", {
                            tenantId: project === null || project === void 0 ? void 0 : project.tenantId,
                            projectId: args.projectId,
                            name: name,
                            role: "SPECIALIST",
                            status: "ACTIVE",
                            workspacePath: workspacePath,
                            allowedTaskTypes: allowedTaskTypes,
                            budgetDaily: budgetDaily,
                            budgetPerRun: budgetPerRun,
                            spendToday: 0,
                            canSpawn: false,
                            maxSubAgents: 0,
                            errorStreak: 0,
                            lastHeartbeatAt: Date.now(),
                            metadata: {
                                source: "OPENCLAW_GATEWAY",
                                gatewayId: args.discovered.id,
                                alias: args.discovered.alias,
                                description: args.discovered.description,
                            },
                        })];
                case 4:
                    agentId = _d.sent();
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: args.projectId,
                            actorType: "SYSTEM",
                            action: "AGENT_REGISTERED",
                            description: "Agent \"".concat(name, "\" imported from OpenClaw Gateway"),
                            targetType: "AGENT",
                            targetId: agentId,
                            agentId: agentId,
                        })];
                case 5:
                    _d.sent();
                    return [4 /*yield*/, ctx.db.get(agentId)];
                case 6:
                    agent = _d.sent();
                    return [2 /*return*/, { agent: agent, created: true }];
            }
        });
    }); },
});

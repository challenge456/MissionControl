"use strict";
/**
 * Org Assignments Functions
 *
 * Manages the hierarchical org model:
 * Organization -> Projects -> Squads -> Agents
 *
 * Roles: CEO (one per project), LEAD, SPECIALIST, INTERN
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
exports.unassign = exports.assign = exports.getLeads = exports.getCEO = exports.getAgentPositions = exports.getProjectOrg = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var orgPositionValidator = values_1.v.union(values_1.v.literal("CEO"), values_1.v.literal("LEAD"), values_1.v.literal("SPECIALIST"), values_1.v.literal("INTERN"));
var orgScopeValidator = values_1.v.union(values_1.v.literal("PROJECT"), values_1.v.literal("SQUAD"), values_1.v.literal("REPO"));
// ============================================================================
// QUERIES
// ============================================================================
/**
 * Get the full org chart for a project (CEO, leads, specialists, interns).
 */
exports.getProjectOrg = (0, server_1.query)({
    args: {
        projectId: values_1.v.id("projects"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var assignments, ceo, leads, specialists, interns, enrichAssignment, _a;
        var _b;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("orgAssignments")
                        .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                        .collect()];
                case 1:
                    assignments = _d.sent();
                    ceo = (_c = assignments.find(function (a) { return a.orgPosition === "CEO"; })) !== null && _c !== void 0 ? _c : null;
                    leads = assignments.filter(function (a) { return a.orgPosition === "LEAD"; });
                    specialists = assignments.filter(function (a) { return a.orgPosition === "SPECIALIST"; });
                    interns = assignments.filter(function (a) { return a.orgPosition === "INTERN"; });
                    enrichAssignment = function (assignment) { return __awaiter(void 0, void 0, void 0, function () {
                        var agent;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, ctx.db.get(assignment.agentId)];
                                case 1:
                                    agent = _a.sent();
                                    return [2 /*return*/, __assign(__assign({}, assignment), { agent: agent })];
                            }
                        });
                    }); };
                    _b = {
                        projectId: args.projectId
                    };
                    if (!ceo) return [3 /*break*/, 3];
                    return [4 /*yield*/, enrichAssignment(ceo)];
                case 2:
                    _a = _d.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = null;
                    _d.label = 4;
                case 4:
                    _b.ceo = _a;
                    return [4 /*yield*/, Promise.all(leads.map(enrichAssignment))];
                case 5:
                    _b.leads = _d.sent();
                    return [4 /*yield*/, Promise.all(specialists.map(enrichAssignment))];
                case 6:
                    _b.specialists = _d.sent();
                    return [4 /*yield*/, Promise.all(interns.map(enrichAssignment))];
                case 7: return [2 /*return*/, (_b.interns = _d.sent(),
                        _b.total = assignments.length,
                        _b)];
            }
        });
    }); },
});
/**
 * Get all positions for a specific agent across projects.
 */
exports.getAgentPositions = (0, server_1.query)({
    args: {
        agentId: values_1.v.id("agents"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var assignments, enriched;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("orgAssignments")
                        .withIndex("by_agent", function (q) { return q.eq("agentId", args.agentId); })
                        .collect()];
                case 1:
                    assignments = _a.sent();
                    return [4 /*yield*/, Promise.all(assignments.map(function (a) { return __awaiter(void 0, void 0, void 0, function () {
                            var project, _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        if (!a.projectId) return [3 /*break*/, 2];
                                        return [4 /*yield*/, ctx.db.get(a.projectId)];
                                    case 1:
                                        _a = _b.sent();
                                        return [3 /*break*/, 3];
                                    case 2:
                                        _a = null;
                                        _b.label = 3;
                                    case 3:
                                        project = _a;
                                        return [2 /*return*/, __assign(__assign({}, a), { project: project })];
                                }
                            });
                        }); }))];
                case 2:
                    enriched = _a.sent();
                    return [2 /*return*/, enriched];
            }
        });
    }); },
});
/**
 * Get the CEO agent for a specific project.
 */
exports.getCEO = (0, server_1.query)({
    args: {
        projectId: values_1.v.id("projects"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var ceoAssignment, agent;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("orgAssignments")
                        .withIndex("by_project_position", function (q) {
                        return q.eq("projectId", args.projectId).eq("orgPosition", "CEO");
                    })
                        .first()];
                case 1:
                    ceoAssignment = _a.sent();
                    if (!ceoAssignment)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, ctx.db.get(ceoAssignment.agentId)];
                case 2:
                    agent = _a.sent();
                    return [2 /*return*/, __assign(__assign({}, ceoAssignment), { agent: agent })];
            }
        });
    }); },
});
/**
 * Get all lead agents for a project.
 */
exports.getLeads = (0, server_1.query)({
    args: {
        projectId: values_1.v.id("projects"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var leadAssignments;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("orgAssignments")
                        .withIndex("by_project_position", function (q) {
                        return q.eq("projectId", args.projectId).eq("orgPosition", "LEAD");
                    })
                        .collect()];
                case 1:
                    leadAssignments = _a.sent();
                    return [4 /*yield*/, Promise.all(leadAssignments.map(function (a) { return __awaiter(void 0, void 0, void 0, function () {
                            var agent;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, ctx.db.get(a.agentId)];
                                    case 1:
                                        agent = _a.sent();
                                        return [2 /*return*/, __assign(__assign({}, a), { agent: agent })];
                                }
                            });
                        }); }))];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
/**
 * Assign an agent to a project with an org position.
 * Enforces: only one CEO per project.
 */
exports.assign = (0, server_1.mutation)({
    args: {
        agentId: values_1.v.id("agents"),
        projectId: values_1.v.id("projects"),
        orgPosition: orgPositionValidator,
        scope: values_1.v.optional(orgScopeValidator),
        scopeRef: values_1.v.optional(values_1.v.string()),
        assignedBy: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var agent, project, existingCEO, existing, duplicate;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.agentId)];
                case 1:
                    agent = _c.sent();
                    if (!agent)
                        throw new Error("Agent not found");
                    return [4 /*yield*/, ctx.db.get(args.projectId)];
                case 2:
                    project = _c.sent();
                    if (!project)
                        throw new Error("Project not found");
                    if (!(args.orgPosition === "CEO")) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.db
                            .query("orgAssignments")
                            .withIndex("by_project_position", function (q) {
                            return q.eq("projectId", args.projectId).eq("orgPosition", "CEO");
                        })
                            .first()];
                case 3:
                    existingCEO = _c.sent();
                    if (existingCEO && existingCEO.agentId !== args.agentId) {
                        throw new Error("Project already has a CEO (agent ".concat(existingCEO.agentId, "). ") +
                            "Remove the existing CEO assignment first.");
                    }
                    if (!existingCEO) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.db.patch(existingCEO._id, {
                            scope: (_a = args.scope) !== null && _a !== void 0 ? _a : "PROJECT",
                            scopeRef: args.scopeRef,
                            assignedBy: args.assignedBy,
                            assignedAt: Date.now(),
                        })];
                case 4:
                    _c.sent();
                    return [2 /*return*/, existingCEO._id];
                case 5: return [4 /*yield*/, ctx.db
                        .query("orgAssignments")
                        .withIndex("by_agent", function (q) { return q.eq("agentId", args.agentId); })
                        .collect()];
                case 6:
                    existing = _c.sent();
                    duplicate = existing.find(function (a) {
                        return a.projectId === args.projectId &&
                            a.orgPosition === args.orgPosition &&
                            a.scopeRef === args.scopeRef;
                    });
                    if (!duplicate) return [3 /*break*/, 8];
                    // Update existing assignment
                    return [4 /*yield*/, ctx.db.patch(duplicate._id, {
                            assignedBy: args.assignedBy,
                            assignedAt: Date.now(),
                        })];
                case 7:
                    // Update existing assignment
                    _c.sent();
                    return [2 /*return*/, duplicate._id];
                case 8: return [4 /*yield*/, ctx.db.insert("orgAssignments", {
                        agentId: args.agentId,
                        projectId: args.projectId,
                        orgPosition: args.orgPosition,
                        scope: (_b = args.scope) !== null && _b !== void 0 ? _b : "PROJECT",
                        scopeRef: args.scopeRef,
                        assignedBy: args.assignedBy,
                        assignedAt: Date.now(),
                    })];
                case 9: 
                // Create new assignment
                return [2 /*return*/, _c.sent()];
            }
        });
    }); },
});
/**
 * Remove an org assignment.
 */
exports.unassign = (0, server_1.mutation)({
    args: {
        assignmentId: values_1.v.id("orgAssignments"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var assignment;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.assignmentId)];
                case 1:
                    assignment = _a.sent();
                    if (!assignment)
                        throw new Error("Assignment not found");
                    return [4 /*yield*/, ctx.db.delete(args.assignmentId)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
});

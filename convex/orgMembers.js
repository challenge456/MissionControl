"use strict";
/**
 * Convex functions for org members (human team + org chart + RBAC)
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
exports.move = exports.remove = exports.removeProjectAccess = exports.addProjectAccess = exports.updatePermissions = exports.update = exports.create = exports.get = exports.getUnifiedHierarchy = exports.getHierarchy = exports.listAll = exports.list = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
// ============================================================================
// RBAC VALIDATORS
// ============================================================================
var systemRoleValidator = values_1.v.union(values_1.v.literal("OWNER"), values_1.v.literal("ADMIN"), values_1.v.literal("MANAGER"), values_1.v.literal("MEMBER"), values_1.v.literal("VIEWER"));
var accessLevelValidator = values_1.v.union(values_1.v.literal("ADMIN"), values_1.v.literal("EDIT"), values_1.v.literal("VIEW"));
var projectAccessValidator = values_1.v.object({
    projectId: values_1.v.id("projects"),
    accessLevel: accessLevelValidator,
});
// ============================================================================
// QUERIES
// ============================================================================
/**
 * List all org members for a project (or all if no projectId)
 */
exports.list = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var members;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("orgMembers")
                        .withIndex("by_project", function (q) {
                        return args.projectId ? q.eq("projectId", args.projectId) : q;
                    })
                        .filter(function (q) { return q.eq(q.field("active"), true); })
                        .collect()];
                case 1:
                    members = _a.sent();
                    return [2 /*return*/, members.sort(function (a, b) { return a.level - b.level; })];
            }
        });
    }); },
});
/**
 * List ALL org members across all projects (for global People view)
 */
exports.listAll = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var members;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("orgMembers")
                        .filter(function (q) { return q.eq(q.field("active"), true); })
                        .collect()];
                case 1:
                    members = _a.sent();
                    return [2 /*return*/, members.sort(function (a, b) { return a.level - b.level; })];
            }
        });
    }); },
});
/**
 * Get org hierarchy tree (for org chart visualization)
 */
exports.getHierarchy = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var members, memberMap, roots, _i, _a, member, parent_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("orgMembers")
                        .withIndex("by_project", function (q) {
                        return args.projectId ? q.eq("projectId", args.projectId) : q;
                    })
                        .filter(function (q) { return q.eq(q.field("active"), true); })
                        .collect()];
                case 1:
                    members = _b.sent();
                    memberMap = new Map(members.map(function (m) { return [m._id, __assign(__assign({}, m), { children: [] })]; }));
                    roots = [];
                    for (_i = 0, _a = memberMap.values(); _i < _a.length; _i++) {
                        member = _a[_i];
                        if (member.parentMemberId) {
                            parent_1 = memberMap.get(member.parentMemberId);
                            if (parent_1) {
                                parent_1.children.push(member);
                            }
                        }
                        else {
                            roots.push(member);
                        }
                    }
                    return [2 /*return*/, roots];
            }
        });
    }); },
});
/**
 * Get unified org hierarchy combining humans and agents
 */
exports.getUnifiedHierarchy = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var members, agents, _a, memberMap, roots, _loop_1, _i, _b, member, agentMap, _c, _d, agent, parentAgent;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("orgMembers")
                        .withIndex("by_project", function (q) {
                        return args.projectId ? q.eq("projectId", args.projectId) : q;
                    })
                        .filter(function (q) { return q.eq(q.field("active"), true); })
                        .collect()];
                case 1:
                    members = _e.sent();
                    if (!args.projectId) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 2:
                    _a = _e.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, ctx.db.query("agents").collect()];
                case 4:
                    _a = _e.sent();
                    _e.label = 5;
                case 5:
                    agents = _a;
                    memberMap = new Map(members.map(function (m) { return [
                        m._id,
                        {
                            id: "human-".concat(m._id),
                            type: "human",
                            _id: m._id,
                            name: m.name,
                            role: m.role,
                            avatar: m.avatar,
                            active: m.active,
                            responsibilities: m.responsibilities,
                            children: [],
                        },
                    ]; }));
                    roots = [];
                    _loop_1 = function (member) {
                        var originalMember = members.find(function (m) { return m._id === member._id; });
                        if (originalMember === null || originalMember === void 0 ? void 0 : originalMember.parentMemberId) {
                            var parent_2 = memberMap.get(originalMember.parentMemberId);
                            if (parent_2) {
                                parent_2.children.push(member);
                            }
                        }
                        else {
                            roots.push(member);
                        }
                    };
                    // Build human tree
                    for (_i = 0, _b = memberMap.values(); _i < _b.length; _i++) {
                        member = _b[_i];
                        _loop_1(member);
                    }
                    agentMap = new Map(agents.map(function (a) {
                        var _a;
                        return [
                            a._id,
                            {
                                id: "agent-".concat(a._id),
                                type: "agent",
                                _id: a._id,
                                name: a.name,
                                role: a.role,
                                emoji: a.emoji,
                                active: a.status === "ACTIVE",
                                status: a.status,
                                agentRole: a.role,
                                model: ((_a = a.metadata) === null || _a === void 0 ? void 0 : _a.model) || "Claude Opus 4.5",
                                budgetDaily: a.budgetDaily,
                                budgetPerRun: a.budgetPerRun,
                                spendToday: a.spendToday,
                                allowedTaskTypes: a.allowedTaskTypes,
                                parentAgentId: a.parentAgentId,
                                children: [],
                            },
                        ];
                    }));
                    // Attach agents to hierarchy
                    for (_c = 0, _d = agentMap.values(); _c < _d.length; _c++) {
                        agent = _d[_c];
                        if (agent.parentAgentId) {
                            parentAgent = agentMap.get(agent.parentAgentId);
                            if (parentAgent) {
                                parentAgent.children.push(agent);
                            }
                        }
                        else {
                            if (roots.length > 0) {
                                roots[0].children.push(agent);
                            }
                            else {
                                roots.push(agent);
                            }
                        }
                    }
                    return [2 /*return*/, roots];
            }
        });
    }); },
});
/**
 * Get a single org member by ID
 */
exports.get = (0, server_1.query)({
    args: {
        id: values_1.v.id("orgMembers"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.id)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
/**
 * Create a new org member with RBAC
 */
exports.create = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        name: values_1.v.string(),
        email: values_1.v.optional(values_1.v.string()),
        role: values_1.v.string(),
        title: values_1.v.optional(values_1.v.string()),
        avatar: values_1.v.optional(values_1.v.string()),
        parentMemberId: values_1.v.optional(values_1.v.id("orgMembers")),
        level: values_1.v.number(),
        responsibilities: values_1.v.optional(values_1.v.array(values_1.v.string())),
        systemRole: values_1.v.optional(systemRoleValidator),
        projectAccess: values_1.v.optional(values_1.v.array(projectAccessValidator)),
        permissions: values_1.v.optional(values_1.v.array(values_1.v.string())),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var existing;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.email) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("orgMembers")
                            .withIndex("by_email", function (q) { return q.eq("email", args.email); })
                            .first()];
                case 1:
                    existing = _a.sent();
                    if (existing && existing.active) {
                        throw new Error("A member with email ".concat(args.email, " already exists"));
                    }
                    _a.label = 2;
                case 2: return [4 /*yield*/, ctx.db.insert("orgMembers", __assign(__assign({}, args), { active: true, invitedAt: Date.now() }))];
                case 3: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/**
 * Update an org member (including RBAC fields)
 */
exports.update = (0, server_1.mutation)({
    args: {
        id: values_1.v.id("orgMembers"),
        name: values_1.v.optional(values_1.v.string()),
        email: values_1.v.optional(values_1.v.string()),
        role: values_1.v.optional(values_1.v.string()),
        title: values_1.v.optional(values_1.v.string()),
        avatar: values_1.v.optional(values_1.v.string()),
        parentMemberId: values_1.v.optional(values_1.v.id("orgMembers")),
        level: values_1.v.optional(values_1.v.number()),
        responsibilities: values_1.v.optional(values_1.v.array(values_1.v.string())),
        systemRole: values_1.v.optional(systemRoleValidator),
        projectAccess: values_1.v.optional(values_1.v.array(projectAccessValidator)),
        permissions: values_1.v.optional(values_1.v.array(values_1.v.string())),
        active: values_1.v.optional(values_1.v.boolean()),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var id, updates, filtered;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    id = args.id, updates = __rest(args, ["id"]);
                    filtered = Object.fromEntries(Object.entries(updates).filter(function (_a) {
                        var _ = _a[0], v = _a[1];
                        return v !== undefined;
                    }));
                    return [4 /*yield*/, ctx.db.patch(id, filtered)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, id];
            }
        });
    }); },
});
/**
 * Update ONLY the role & permissions for a member
 */
exports.updatePermissions = (0, server_1.mutation)({
    args: {
        id: values_1.v.id("orgMembers"),
        systemRole: values_1.v.optional(systemRoleValidator),
        projectAccess: values_1.v.optional(values_1.v.array(projectAccessValidator)),
        permissions: values_1.v.optional(values_1.v.array(values_1.v.string())),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var member, updates;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.id)];
                case 1:
                    member = _a.sent();
                    if (!member)
                        throw new Error("Member not found");
                    updates = {};
                    if (args.systemRole !== undefined)
                        updates.systemRole = args.systemRole;
                    if (args.projectAccess !== undefined)
                        updates.projectAccess = args.projectAccess;
                    if (args.permissions !== undefined)
                        updates.permissions = args.permissions;
                    return [4 /*yield*/, ctx.db.patch(args.id, updates)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, args.id];
            }
        });
    }); },
});
/**
 * Add project access for a member
 */
exports.addProjectAccess = (0, server_1.mutation)({
    args: {
        memberId: values_1.v.id("orgMembers"),
        projectId: values_1.v.id("projects"),
        accessLevel: accessLevelValidator,
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var member, existing, filtered;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.memberId)];
                case 1:
                    member = _a.sent();
                    if (!member)
                        throw new Error("Member not found");
                    existing = member.projectAccess || [];
                    filtered = existing.filter(function (pa) { return pa.projectId !== args.projectId; });
                    filtered.push({
                        projectId: args.projectId,
                        accessLevel: args.accessLevel,
                    });
                    return [4 /*yield*/, ctx.db.patch(args.memberId, { projectAccess: filtered })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, args.memberId];
            }
        });
    }); },
});
/**
 * Remove project access for a member
 */
exports.removeProjectAccess = (0, server_1.mutation)({
    args: {
        memberId: values_1.v.id("orgMembers"),
        projectId: values_1.v.id("projects"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var member, existing, filtered;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.memberId)];
                case 1:
                    member = _a.sent();
                    if (!member)
                        throw new Error("Member not found");
                    existing = member.projectAccess || [];
                    filtered = existing.filter(function (pa) { return pa.projectId !== args.projectId; });
                    return [4 /*yield*/, ctx.db.patch(args.memberId, { projectAccess: filtered })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, args.memberId];
            }
        });
    }); },
});
/**
 * Delete an org member (soft delete by setting active = false)
 */
exports.remove = (0, server_1.mutation)({
    args: {
        id: values_1.v.id("orgMembers"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.patch(args.id, { active: false })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, args.id];
            }
        });
    }); },
});
/**
 * Move an org member to a new parent (reorganize hierarchy)
 */
exports.move = (0, server_1.mutation)({
    args: {
        id: values_1.v.id("orgMembers"),
        newParentId: values_1.v.optional(values_1.v.id("orgMembers")),
        newLevel: values_1.v.number(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var member, oldLevel, levelDelta, allMembers_2, childrenMap_1, _i, allMembers_1, m, siblings, updateDescendants_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.id)];
                case 1:
                    member = _a.sent();
                    if (!member) {
                        throw new Error("Member not found");
                    }
                    oldLevel = member.level;
                    levelDelta = args.newLevel - oldLevel;
                    // Update the member being moved
                    return [4 /*yield*/, ctx.db.patch(args.id, {
                            parentMemberId: args.newParentId,
                            level: args.newLevel,
                        })];
                case 2:
                    // Update the member being moved
                    _a.sent();
                    if (!(levelDelta !== 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.db
                            .query("orgMembers")
                            .withIndex("by_project", function (q) {
                            return member.projectId ? q.eq("projectId", member.projectId) : q;
                        })
                            .collect()];
                case 3:
                    allMembers_2 = _a.sent();
                    childrenMap_1 = new Map();
                    for (_i = 0, allMembers_1 = allMembers_2; _i < allMembers_1.length; _i++) {
                        m = allMembers_1[_i];
                        if (m.parentMemberId) {
                            siblings = childrenMap_1.get(m.parentMemberId) || [];
                            siblings.push(m._id);
                            childrenMap_1.set(m.parentMemberId, siblings);
                        }
                    }
                    updateDescendants_1 = function (parentId) { return __awaiter(void 0, void 0, void 0, function () {
                        var children, _loop_2, _i, children_1, childId;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    children = childrenMap_1.get(parentId) || [];
                                    _loop_2 = function (childId) {
                                        var child;
                                        return __generator(this, function (_b) {
                                            switch (_b.label) {
                                                case 0:
                                                    child = allMembers_2.find(function (m) { return m._id === childId; });
                                                    if (!child) return [3 /*break*/, 3];
                                                    return [4 /*yield*/, ctx.db.patch(childId, {
                                                            level: child.level + levelDelta,
                                                        })];
                                                case 1:
                                                    _b.sent();
                                                    return [4 /*yield*/, updateDescendants_1(childId)];
                                                case 2:
                                                    _b.sent();
                                                    _b.label = 3;
                                                case 3: return [2 /*return*/];
                                            }
                                        });
                                    };
                                    _i = 0, children_1 = children;
                                    _a.label = 1;
                                case 1:
                                    if (!(_i < children_1.length)) return [3 /*break*/, 4];
                                    childId = children_1[_i];
                                    return [5 /*yield**/, _loop_2(childId)];
                                case 2:
                                    _a.sent();
                                    _a.label = 3;
                                case 3:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); };
                    return [4 /*yield*/, updateDescendants_1(args.id)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [2 /*return*/, args.id];
            }
        });
    }); },
});

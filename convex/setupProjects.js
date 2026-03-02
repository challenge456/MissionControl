"use strict";
/**
 * Setup Projects - Create initial projects
 *
 * Run with: npx convex run setupProjects:createInitialProjects
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
exports.createInitialProjects = void 0;
var server_1 = require("./_generated/server");
exports.createInitialProjects = (0, server_1.internalMutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var results, sellerfiExists, sellerfiId, mcExists, mcId, allProjects;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    results = [];
                    return [4 /*yield*/, ctx.db
                            .query("projects")
                            .withIndex("by_slug", function (q) { return q.eq("slug", "sellerfi"); })
                            .first()];
                case 1:
                    sellerfiExists = _a.sent();
                    if (!!sellerfiExists) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.insert("projects", {
                            name: "SellerFi",
                            slug: "sellerfi",
                            description: "SellerFi work and repository",
                            policyDefaults: {
                                budgetDefaults: {
                                    INTERN: { daily: 2, perRun: 0.25 },
                                    SPECIALIST: { daily: 5, perRun: 0.75 },
                                    LEAD: { daily: 12, perRun: 1.5 },
                                },
                            },
                        })];
                case 2:
                    sellerfiId = _a.sent();
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            actorType: "SYSTEM",
                            action: "PROJECT_CREATED",
                            description: "Project 'SellerFi' created",
                            targetType: "PROJECT",
                            targetId: sellerfiId,
                            projectId: sellerfiId,
                        })];
                case 3:
                    _a.sent();
                    results.push({ name: "SellerFi", id: sellerfiId, created: true });
                    return [3 /*break*/, 5];
                case 4:
                    results.push({ name: "SellerFi", id: sellerfiExists._id, created: false, message: "Already exists" });
                    _a.label = 5;
                case 5: return [4 /*yield*/, ctx.db
                        .query("projects")
                        .withIndex("by_slug", function (q) { return q.eq("slug", "mission-control"); })
                        .first()];
                case 6:
                    mcExists = _a.sent();
                    if (!!mcExists) return [3 /*break*/, 9];
                    return [4 /*yield*/, ctx.db.insert("projects", {
                            name: "Mission Control",
                            slug: "mission-control",
                            description: "Mission Control development and maintenance",
                            policyDefaults: {
                                budgetDefaults: {
                                    INTERN: { daily: 2, perRun: 0.25 },
                                    SPECIALIST: { daily: 5, perRun: 0.75 },
                                    LEAD: { daily: 12, perRun: 1.5 },
                                },
                            },
                        })];
                case 7:
                    mcId = _a.sent();
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            actorType: "SYSTEM",
                            action: "PROJECT_CREATED",
                            description: "Project 'Mission Control' created",
                            targetType: "PROJECT",
                            targetId: mcId,
                            projectId: mcId,
                        })];
                case 8:
                    _a.sent();
                    results.push({ name: "Mission Control", id: mcId, created: true });
                    return [3 /*break*/, 10];
                case 9:
                    results.push({ name: "Mission Control", id: mcExists._id, created: false, message: "Already exists" });
                    _a.label = 10;
                case 10: return [4 /*yield*/, ctx.db.query("projects").collect()];
                case 11:
                    allProjects = _a.sent();
                    return [2 /*return*/, {
                            results: results,
                            allProjects: allProjects.map(function (p) { return ({ name: p.name, slug: p.slug, id: p._id }); }),
                        }];
            }
        });
    }); },
});

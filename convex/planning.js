"use strict";
/**
 * Planning — AI Task Planning Q&A
 *
 * Generate clarifying questions for a task, then produce a work plan from answers.
 * Submit plan attaches workPlan + planningQa to task and transitions INBOX -> ASSIGNED.
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
exports.generatePlanFromAnswers = exports.generateQuestions = exports.submitPlan = exports.getTaskForPlanning = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var api_1 = require("./_generated/api");
// ============================================================================
// QUERIES
// ============================================================================
exports.getTaskForPlanning = (0, server_1.query)({
    args: { taskId: values_1.v.id("tasks") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
/**
 * Attach work plan and Q&A to task, then transition INBOX -> ASSIGNED.
 * If assigneeIds is provided, patches task with assignees first.
 */
exports.submitPlan = (0, server_1.mutation)({
    args: {
        taskId: values_1.v.id("tasks"),
        workPlan: values_1.v.object({
            bullets: values_1.v.array(values_1.v.string()),
            estimatedCost: values_1.v.optional(values_1.v.number()),
            estimatedDuration: values_1.v.optional(values_1.v.string()),
        }),
        planningQa: values_1.v.array(values_1.v.object({
            question: values_1.v.string(),
            answer: values_1.v.string(),
        })),
        assigneeIds: values_1.v.optional(values_1.v.array(values_1.v.id("agents"))),
        idempotencyKey: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var task, resolveAgentRef, preferInstanceRefs, resolvedIds, list, _a, resolved, assigneeInstanceIds;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1:
                    task = _b.sent();
                    if (!task)
                        throw new Error("Task not found");
                    if (task.status !== "INBOX") {
                        throw new Error("Only INBOX tasks can be planned and assigned");
                    }
                    return [4 /*yield*/, Promise.resolve().then(function () { return require("./lib/agentResolver"); })];
                case 2:
                    resolveAgentRef = (_b.sent()).resolveAgentRef;
                    return [4 /*yield*/, Promise.resolve().then(function () { return require("./lib/armCompat"); })];
                case 3:
                    preferInstanceRefs = (_b.sent()).preferInstanceRefs;
                    if (!(args.assigneeIds && args.assigneeIds.length > 0)) return [3 /*break*/, 4];
                    resolvedIds = args.assigneeIds;
                    return [3 /*break*/, 9];
                case 4:
                    if (!task.projectId) return [3 /*break*/, 6];
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_project_status", function (q) {
                            return q.eq("projectId", task.projectId).eq("status", "ACTIVE");
                        })
                            .take(5)];
                case 5:
                    _a = _b.sent();
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, ctx.db
                        .query("agents")
                        .withIndex("by_status", function (q) { return q.eq("status", "ACTIVE"); })
                        .take(5)];
                case 7:
                    _a = _b.sent();
                    _b.label = 8;
                case 8:
                    list = _a;
                    resolvedIds = list.slice(0, 1).map(function (a) { return a._id; });
                    _b.label = 9;
                case 9: return [4 /*yield*/, Promise.all(resolvedIds.map(function (agentId) {
                        return resolveAgentRef({ db: ctx.db }, { agentId: agentId, createIfMissing: true });
                    }))];
                case 10:
                    resolved = _b.sent();
                    assigneeInstanceIds = resolved
                        .filter(function (r) { return r !== null; })
                        .map(function (r) { return r.instanceId; });
                    return [4 /*yield*/, ctx.db.patch(args.taskId, __assign({ workPlan: args.workPlan, planningQa: args.planningQa, assigneeIds: resolvedIds }, (preferInstanceRefs() && assigneeInstanceIds.length > 0
                            ? { assigneeInstanceIds: assigneeInstanceIds }
                            : {})))];
                case 11:
                    _b.sent();
                    return [4 /*yield*/, ctx.runMutation(api_1.api.tasks.transition, {
                            taskId: args.taskId,
                            toStatus: "ASSIGNED",
                            actorType: "HUMAN",
                            actorUserId: "operator",
                            idempotencyKey: args.idempotencyKey,
                            reason: "Plan submitted from AI Planning",
                            workPlan: args.workPlan,
                        })];
                case 12:
                    _b.sent();
                    return [2 /*return*/, { success: true, taskId: args.taskId }];
            }
        });
    }); },
});
// ============================================================================
// ACTIONS (LLM)
// ============================================================================
/**
 * Generate 3–5 clarifying questions for the task based on title, description, type.
 * Uses OPENAI_API_KEY from Convex env when set; otherwise returns default questions.
 */
exports.generateQuestions = (0, server_1.action)({
    args: {
        title: values_1.v.string(),
        description: values_1.v.optional(values_1.v.string()),
        type: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var apiKey, prompt_1, res, err, data, text, questions, e_1;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    apiKey = process.env.OPENAI_API_KEY;
                    if (!apiKey) return [3 /*break*/, 7];
                    prompt_1 = "You are helping clarify a task before an AI agent works on it. Given this task, generate 3 to 5 short clarifying questions that will help create a precise work plan. One question per line. No numbering. Be concise.\n\nTASK TYPE: ".concat(args.type, "\nTITLE: ").concat(args.title, "\n").concat(args.description ? "DESCRIPTION: ".concat(args.description) : "", "\n\nOutput only the questions, one per line:");
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, fetch("https://api.openai.com/v1/chat/completions", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "Bearer ".concat(apiKey),
                            },
                            body: JSON.stringify({
                                model: "gpt-4o-mini",
                                messages: [{ role: "user", content: prompt_1 }],
                                temperature: 0.3,
                                max_tokens: 500,
                            }),
                        })];
                case 2:
                    res = _e.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.text()];
                case 3:
                    err = _e.sent();
                    throw new Error("OpenAI API error: ".concat(res.status, " ").concat(err));
                case 4: return [4 /*yield*/, res.json()];
                case 5:
                    data = (_e.sent());
                    text = (_d = (_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.trim();
                    if (!text)
                        throw new Error("Empty response from OpenAI");
                    questions = text
                        .split("\n")
                        .map(function (q) { return q.replace(/^\d+[.)]\s*/, "").trim(); })
                        .filter(function (q) { return q.length > 0; })
                        .slice(0, 5);
                    return [2 /*return*/, { questions: questions.length ? questions : getDefaultQuestions(args.type) }];
                case 6:
                    e_1 = _e.sent();
                    return [2 /*return*/, {
                            questions: getDefaultQuestions(args.type),
                        }];
                case 7: return [2 /*return*/, { questions: getDefaultQuestions(args.type) }];
            }
        });
    }); },
});
/**
 * Generate a structured work plan from task context and Q&A answers.
 */
exports.generatePlanFromAnswers = (0, server_1.action)({
    args: {
        title: values_1.v.string(),
        description: values_1.v.optional(values_1.v.string()),
        type: values_1.v.string(),
        answers: values_1.v.array(values_1.v.object({ question: values_1.v.string(), answer: values_1.v.string() })),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var apiKey, qaBlock, defaultPlan, prompt_2, res, err, data, text, parsed, bullets, estimatedCost, estimatedDuration, _a;
        var _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    apiKey = process.env.OPENAI_API_KEY;
                    qaBlock = args.answers
                        .map(function (a) { return "Q: ".concat(a.question, "\nA: ").concat(a.answer); })
                        .join("\n\n");
                    defaultPlan = {
                        bullets: [
                            "Review requirements and context",
                            "Execute main deliverables",
                            "Self-review and submit for review",
                        ],
                        estimatedCost: 0.5,
                        estimatedDuration: "1–2 hours",
                    };
                    if (!apiKey) return [3 /*break*/, 7];
                    prompt_2 = "You are creating a work plan for an AI agent task. Based on the task and the Q&A, output a JSON object with:\n- \"bullets\": array of 3\u20137 short actionable steps (strings)\n- \"estimatedCost\": number in USD (e.g. 0.5)\n- \"estimatedDuration\": string (e.g. \"30 min\" or \"1\u20132 hours\")\n\nTASK: ".concat(args.title, "\nTYPE: ").concat(args.type, "\n").concat(args.description ? "DESCRIPTION: ".concat(args.description) : "", "\n\nQ&A:\n").concat(qaBlock, "\n\nRespond with valid JSON only, no markdown:");
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, fetch("https://api.openai.com/v1/chat/completions", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "Bearer ".concat(apiKey),
                            },
                            body: JSON.stringify({
                                model: "gpt-4o-mini",
                                messages: [{ role: "user", content: prompt_2 }],
                                temperature: 0.2,
                                max_tokens: 800,
                            }),
                        })];
                case 2:
                    res = _f.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.text()];
                case 3:
                    err = _f.sent();
                    throw new Error("OpenAI API error: ".concat(res.status, " ").concat(err));
                case 4: return [4 /*yield*/, res.json()];
                case 5:
                    data = (_f.sent());
                    text = (_e = (_d = (_c = (_b = data.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) === null || _e === void 0 ? void 0 : _e.trim();
                    if (!text)
                        throw new Error("Empty response from OpenAI");
                    parsed = JSON.parse(text);
                    bullets = Array.isArray(parsed.bullets)
                        ? parsed.bullets.map(function (b) { return String(b).slice(0, 300); })
                        : defaultPlan.bullets;
                    estimatedCost = typeof parsed.estimatedCost === "number" ? parsed.estimatedCost : defaultPlan.estimatedCost;
                    estimatedDuration = typeof parsed.estimatedDuration === "string"
                        ? parsed.estimatedDuration.slice(0, 100)
                        : defaultPlan.estimatedDuration;
                    return [2 /*return*/, { bullets: bullets, estimatedCost: estimatedCost, estimatedDuration: estimatedDuration }];
                case 6:
                    _a = _f.sent();
                    return [2 /*return*/, defaultPlan];
                case 7: return [2 /*return*/, defaultPlan];
            }
        });
    }); },
});
function getDefaultQuestions(type) {
    return [
        "What is the main deliverable or outcome?",
        "Are there any constraints (time, format, tools)?",
        "Who or what system will consume the output?",
    ];
}

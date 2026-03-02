"use strict";
/**
 * PRD — Convex Functions
 *
 * PRD Import Pipeline: parse markdown PRDs into structured tasks, store documents, bulk create.
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
exports.parsePrd = exports.bulkCreateFromPrd = exports.storePrdDocument = exports.getPrdDocument = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var taskEvents_1 = require("./lib/taskEvents");
// Task types allowed in Mission Control (must match schema taskType)
var TASK_TYPES = [
    "CONTENT",
    "SOCIAL",
    "EMAIL_MARKETING",
    "CUSTOMER_RESEARCH",
    "SEO_RESEARCH",
    "ENGINEERING",
    "DOCS",
    "OPS",
];
// ============================================================================
// QUERIES
// ============================================================================
/**
 * Get a stored PRD document by ID.
 */
exports.getPrdDocument = (0, server_1.query)({
    args: { id: values_1.v.id("prdDocuments") },
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
 * Store raw PRD markdown in prdDocuments for reference and sourceRef linking.
 */
exports.storePrdDocument = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        title: values_1.v.string(),
        content: values_1.v.string(),
        taskCount: values_1.v.number(),
        createdBy: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.insert("prdDocuments", {
                        projectId: args.projectId,
                        title: args.title,
                        content: args.content,
                        taskCount: args.taskCount,
                        parsedAt: Date.now(),
                        createdBy: args.createdBy,
                    })];
                case 1:
                    id = _a.sent();
                    return [2 /*return*/, id];
            }
        });
    }); },
});
/**
 * Bulk create tasks from parsed PRD list. Each task gets source PRD_IMPORT and sourceRef = prdDocumentId.
 * Creates taskDependencies for dependencyIndices when provided.
 */
exports.bulkCreateFromPrd = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        prdDocumentId: values_1.v.id("prdDocuments"),
        tasks: values_1.v.array(values_1.v.object({
            title: values_1.v.string(),
            description: values_1.v.optional(values_1.v.string()),
            type: values_1.v.string(),
            priority: values_1.v.number(),
            dependencyIndices: values_1.v.optional(values_1.v.array(values_1.v.number())),
        })),
        createdBy: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var doc, project, _a, tenantId, sourceRef, createdBy, createdIds, _loop_1, i, batchParentId, i, deps, taskId, _i, deps_1, depIdx, dependsOnTaskId;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.prdDocumentId)];
                case 1:
                    doc = _e.sent();
                    if (!doc)
                        throw new Error("PRD document not found");
                    if (!args.projectId) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db.get(args.projectId)];
                case 2:
                    _a = _e.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = null;
                    _e.label = 4;
                case 4:
                    project = _a;
                    tenantId = project ? project.tenantId : undefined;
                    sourceRef = args.prdDocumentId;
                    createdBy = (_b = args.createdBy) !== null && _b !== void 0 ? _b : "SYSTEM";
                    createdIds = [];
                    _loop_1 = function (i) {
                        var t, idempotencyKey, existing, priority, type, taskId;
                        return __generator(this, function (_f) {
                            switch (_f.label) {
                                case 0:
                                    t = args.tasks[i];
                                    idempotencyKey = "prd:".concat(args.prdDocumentId, ":").concat(i);
                                    return [4 /*yield*/, ctx.db
                                            .query("tasks")
                                            .withIndex("by_idempotency", function (q) { return q.eq("idempotencyKey", idempotencyKey); })
                                            .first()];
                                case 1:
                                    existing = _f.sent();
                                    if (existing) {
                                        createdIds.push(existing._id);
                                        return [2 /*return*/, "continue"];
                                    }
                                    priority = Math.min(4, Math.max(1, t.priority));
                                    type = TASK_TYPES.includes(t.type)
                                        ? t.type
                                        : "ENGINEERING";
                                    return [4 /*yield*/, ctx.db.insert("tasks", {
                                            tenantId: tenantId,
                                            projectId: args.projectId,
                                            title: t.title.slice(0, 500),
                                            description: (_c = t.description) === null || _c === void 0 ? void 0 : _c.slice(0, 5000),
                                            type: type,
                                            status: "INBOX",
                                            priority: priority,
                                            assigneeIds: [],
                                            reviewCycles: 0,
                                            actualCost: 0,
                                            idempotencyKey: idempotencyKey,
                                            source: "PRD_IMPORT",
                                            sourceRef: sourceRef,
                                            createdBy: createdBy,
                                            metadata: { prdDocumentId: args.prdDocumentId, index: i },
                                        })];
                                case 2:
                                    taskId = _f.sent();
                                    createdIds.push(taskId);
                                    return [4 /*yield*/, ctx.db.insert("activities", {
                                            projectId: args.projectId,
                                            actorType: createdBy,
                                            action: "TASK_CREATED",
                                            description: "Task \"".concat(t.title.slice(0, 50), "\" created via PRD_IMPORT"),
                                            targetType: "TASK",
                                            targetId: taskId,
                                            taskId: taskId,
                                        })];
                                case 3:
                                    _f.sent();
                                    return [4 /*yield*/, (0, taskEvents_1.logTaskEvent)(ctx, {
                                            taskId: taskId,
                                            projectId: args.projectId,
                                            eventType: "TASK_CREATED",
                                            actorType: createdBy,
                                            relatedId: taskId,
                                            afterState: { status: "INBOX", title: t.title, type: type, priority: priority },
                                            metadata: { source: "PRD_IMPORT", sourceRef: sourceRef },
                                        })];
                                case 4:
                                    _f.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _e.label = 5;
                case 5:
                    if (!(i < args.tasks.length)) return [3 /*break*/, 8];
                    return [5 /*yield**/, _loop_1(i)];
                case 6:
                    _e.sent();
                    _e.label = 7;
                case 7:
                    i++;
                    return [3 /*break*/, 5];
                case 8:
                    batchParentId = (_d = createdIds[0]) !== null && _d !== void 0 ? _d : undefined;
                    i = 0;
                    _e.label = 9;
                case 9:
                    if (!(i < args.tasks.length)) return [3 /*break*/, 14];
                    deps = args.tasks[i].dependencyIndices;
                    if (!(deps === null || deps === void 0 ? void 0 : deps.length) || !createdIds[i])
                        return [3 /*break*/, 13];
                    taskId = createdIds[i];
                    _i = 0, deps_1 = deps;
                    _e.label = 10;
                case 10:
                    if (!(_i < deps_1.length)) return [3 /*break*/, 13];
                    depIdx = deps_1[_i];
                    if (!(depIdx >= 0 && depIdx < createdIds.length && createdIds[depIdx])) return [3 /*break*/, 12];
                    dependsOnTaskId = createdIds[depIdx];
                    return [4 /*yield*/, ctx.db.insert("taskDependencies", {
                            parentTaskId: batchParentId !== null && batchParentId !== void 0 ? batchParentId : dependsOnTaskId,
                            taskId: taskId,
                            dependsOnTaskId: dependsOnTaskId,
                        })];
                case 11:
                    _e.sent();
                    _e.label = 12;
                case 12:
                    _i++;
                    return [3 /*break*/, 10];
                case 13:
                    i++;
                    return [3 /*break*/, 9];
                case 14: return [2 /*return*/, { createdCount: createdIds.length, taskIds: createdIds }];
            }
        });
    }); },
});
// ============================================================================
// ACTIONS
// ============================================================================
/**
 * Parse PRD markdown with LLM and return structured task previews.
 * Uses OPENAI_API_KEY from Convex env when set; otherwise returns heuristic extraction.
 */
exports.parsePrd = (0, server_1.action)({
    args: {
        content: values_1.v.string(),
        maxTasks: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var maxTasks, content, apiKey, prompt_1, res, err, data, text, parsed, tasks_1, normalized, e_1, lines, tasks, currentTitle, currentLines, flush, _i, lines_1, line, match;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    maxTasks = (_a = args.maxTasks) !== null && _a !== void 0 ? _a : 20;
                    content = args.content.trim();
                    if (!content)
                        return [2 /*return*/, { tasks: [] }];
                    apiKey = process.env.OPENAI_API_KEY;
                    if (!apiKey) return [3 /*break*/, 7];
                    prompt_1 = "You are parsing a Product Requirements Document (PRD) into discrete, actionable tasks for an orchestration system.\n\nTASK TYPES (use exactly one per task): ENGINEERING, CONTENT, DOCS, OPS, SOCIAL, EMAIL_MARKETING, CUSTOMER_RESEARCH, SEO_RESEARCH\nPRIORITY: 1 = critical, 2 = high, 3 = normal, 4 = low. Base on dependency order and criticality.\nDEPENDENCIES: For each task, list 0-based indices of tasks that must be completed before this one (optional).\n\nExtract up to ".concat(maxTasks, " concrete tasks. Each task must have:\n- title: short, actionable (max 80 chars)\n- description: 1-3 sentences (optional)\n- type: one of the TASK TYPES above\n- priority: 1, 2, 3, or 4\n- dependencyIndices: optional array of task indices this task depends on\n\nRespond with valid JSON only, no markdown or explanation:\n{\"tasks\":[{\"title\":\"...\",\"description\":\"...\",\"type\":\"ENGINEERING\",\"priority\":2,\"dependencyIndices\":[0]}]}\n\nPRD content:\n---\n").concat(content.slice(0, 28000), "\n---");
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
                                messages: [{ role: "user", content: prompt_1 }],
                                temperature: 0.2,
                                max_tokens: 4096,
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
                    tasks_1 = Array.isArray(parsed.tasks) ? parsed.tasks : [];
                    normalized = tasks_1.slice(0, maxTasks).map(function (t) {
                        var _a;
                        return ({
                            title: String((_a = t.title) !== null && _a !== void 0 ? _a : "").slice(0, 200),
                            description: t.description ? String(t.description).slice(0, 2000) : undefined,
                            type: TASK_TYPES.includes(t.type) ? t.type : "ENGINEERING",
                            priority: Math.min(4, Math.max(1, Number(t.priority) || 3)),
                            dependencyIndices: Array.isArray(t.dependencyIndices)
                                ? t.dependencyIndices.filter(function (i) { return typeof i === "number" && i >= 0; })
                                : undefined,
                        });
                    });
                    return [2 /*return*/, { tasks: normalized }];
                case 6:
                    e_1 = _f.sent();
                    throw new Error("PRD parsing failed: ".concat(e_1 instanceof Error ? e_1.message : String(e_1), ". Ensure OPENAI_API_KEY is set in Convex dashboard."));
                case 7:
                    lines = content.split("\n");
                    tasks = [];
                    currentTitle = "";
                    currentLines = [];
                    flush = function () {
                        if (currentTitle.trim()) {
                            tasks.push({
                                title: currentTitle.trim().slice(0, 200),
                                description: currentLines.join("\n").trim().slice(0, 1500) || undefined,
                                type: "ENGINEERING",
                                priority: 3,
                            });
                        }
                        currentTitle = "";
                        currentLines = [];
                    };
                    for (_i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                        line = lines_1[_i];
                        match = line.match(/^#{1,3}\s+(.+)/);
                        if (match && (line.startsWith("## ") || line.startsWith("### "))) {
                            flush();
                            currentTitle = match[1].trim();
                        }
                        else if (currentTitle) {
                            currentLines.push(line);
                        }
                    }
                    flush();
                    return [2 /*return*/, { tasks: tasks.slice(0, maxTasks) }];
            }
        });
    }); },
});

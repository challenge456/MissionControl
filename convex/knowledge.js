"use strict";
/**
 * Knowledge Base — RAG + Semantic Search over docs
 *
 * Indexes markdown docs as vector embeddings via OpenAI text-embedding-3-small.
 * Supports semantic search and chat-with-repo via GPT-4o-mini.
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithRepo = exports.getChunkById = exports.semanticSearch = exports.indexAllDocs = exports.indexDocument = exports.clearChatHistory = exports.storeChatMessage = exports.clearSource = exports.storeChunk = exports.getTotalChunks = exports.getChatHistory = exports.getIndexedSources = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var api_1 = require("./_generated/api");
// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------
var EMBED_MODEL = "text-embedding-3-small";
var CHAT_MODEL = "gpt-4o-mini";
var CHUNK_SIZE = 1200;
var CHUNK_OVERLAP = 150;
// ---------------------------------------------------------------------------
// QUERIES
// ---------------------------------------------------------------------------
exports.getIndexedSources = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var chunks, sources, _i, chunks_1, c, existing;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("knowledgeChunks").collect()];
                case 1:
                    chunks = _a.sent();
                    sources = new Map();
                    for (_i = 0, chunks_1 = chunks; _i < chunks_1.length; _i++) {
                        c = chunks_1[_i];
                        existing = sources.get(c.source);
                        if (existing) {
                            existing.count++;
                        }
                        else {
                            sources.set(c.source, { title: c.title, count: 1 });
                        }
                    }
                    return [2 /*return*/, Array.from(sources.entries()).map(function (_a) {
                            var source = _a[0], meta = _a[1];
                            return ({
                                source: source,
                                title: meta.title,
                                chunkCount: meta.count,
                            });
                        })];
            }
        });
    }); },
});
exports.getChatHistory = (0, server_1.query)({
    args: { sessionId: values_1.v.string() },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("knowledgeChatHistory")
                        .withIndex("by_session", function (q) { return q.eq("sessionId", args.sessionId); })
                        .collect()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.getTotalChunks = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var chunks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("knowledgeChunks").collect()];
                case 1:
                    chunks = _a.sent();
                    return [2 /*return*/, chunks.length];
            }
        });
    }); },
});
// ---------------------------------------------------------------------------
// MUTATIONS
// ---------------------------------------------------------------------------
exports.storeChunk = (0, server_1.mutation)({
    args: {
        source: values_1.v.string(),
        title: values_1.v.string(),
        content: values_1.v.string(),
        chunkIndex: values_1.v.number(),
        embedding: values_1.v.array(values_1.v.float64()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var existing, dup;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("knowledgeChunks")
                        .withIndex("by_source", function (q) { return q.eq("source", args.source); })
                        .collect()];
                case 1:
                    existing = _a.sent();
                    dup = existing.find(function (c) { return c.chunkIndex === args.chunkIndex; });
                    if (!dup) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db.patch(dup._id, {
                            content: args.content,
                            embedding: args.embedding,
                            title: args.title,
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, dup._id];
                case 3: return [4 /*yield*/, ctx.db.insert("knowledgeChunks", args)];
                case 4: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.clearSource = (0, server_1.mutation)({
    args: { source: values_1.v.string() },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var chunks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("knowledgeChunks")
                        .withIndex("by_source", function (q) { return q.eq("source", args.source); })
                        .collect()];
                case 1:
                    chunks = _a.sent();
                    return [4 /*yield*/, Promise.all(chunks.map(function (c) { return ctx.db.delete(c._id); }))];
                case 2:
                    _a.sent();
                    return [2 /*return*/, chunks.length];
            }
        });
    }); },
});
exports.storeChatMessage = (0, server_1.mutation)({
    args: {
        sessionId: values_1.v.string(),
        role: values_1.v.union(values_1.v.literal("user"), values_1.v.literal("assistant")),
        content: values_1.v.string(),
        sources: values_1.v.optional(values_1.v.array(values_1.v.object({ title: values_1.v.string(), source: values_1.v.string(), excerpt: values_1.v.string() }))),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.insert("knowledgeChatHistory", args)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.clearChatHistory = (0, server_1.mutation)({
    args: { sessionId: values_1.v.string() },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var msgs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("knowledgeChatHistory")
                        .withIndex("by_session", function (q) { return q.eq("sessionId", args.sessionId); })
                        .collect()];
                case 1:
                    msgs = _a.sent();
                    return [4 /*yield*/, Promise.all(msgs.map(function (m) { return ctx.db.delete(m._id); }))];
                case 2:
                    _a.sent();
                    return [2 /*return*/, msgs.length];
            }
        });
    }); },
});
// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function chunkText(text, size, overlap) {
    if (size === void 0) { size = CHUNK_SIZE; }
    if (overlap === void 0) { overlap = CHUNK_OVERLAP; }
    var chunks = [];
    var start = 0;
    while (start < text.length) {
        chunks.push(text.slice(start, start + size));
        start += size - overlap;
    }
    return chunks;
}
function embedText(apiKey, text) {
    return __awaiter(this, void 0, void 0, function () {
        var res, _a, _b, data;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, fetch("https://api.openai.com/v1/embeddings", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: "Bearer ".concat(apiKey),
                        },
                        body: JSON.stringify({ model: EMBED_MODEL, input: text }),
                    })];
                case 1:
                    res = _c.sent();
                    if (!!res.ok) return [3 /*break*/, 3];
                    _a = Error.bind;
                    _b = "OpenAI embed error: ".concat;
                    return [4 /*yield*/, res.text()];
                case 2: throw new (_a.apply(Error, [void 0, _b.apply("OpenAI embed error: ", [_c.sent()])]))();
                case 3: return [4 /*yield*/, res.json()];
                case 4:
                    data = (_c.sent());
                    return [2 /*return*/, data.data[0].embedding];
            }
        });
    });
}
// ---------------------------------------------------------------------------
// ACTIONS — called from frontend or scheduled
// ---------------------------------------------------------------------------
/**
 * Index a single document (provided as raw markdown content).
 */
exports.indexDocument = (0, server_1.action)({
    args: {
        source: values_1.v.string(),
        title: values_1.v.string(),
        content: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var apiKey, chunks, indexed, i, embedding;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    apiKey = process.env.OPENAI_API_KEY;
                    if (!apiKey)
                        throw new Error("OPENAI_API_KEY not set in Convex env");
                    chunks = chunkText(args.content);
                    indexed = 0;
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < chunks.length)) return [3 /*break*/, 5];
                    return [4 /*yield*/, embedText(apiKey, chunks[i])];
                case 2:
                    embedding = _a.sent();
                    return [4 /*yield*/, ctx.runMutation(api_1.api.knowledge.storeChunk, {
                            source: args.source,
                            title: args.title,
                            content: chunks[i],
                            chunkIndex: i,
                            embedding: embedding,
                        })];
                case 3:
                    _a.sent();
                    indexed++;
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/, { indexed: indexed, chunks: chunks.length }];
            }
        });
    }); },
});
/**
 * Index all built-in docs from GitHub raw URLs.
 * Fetches each doc and runs indexDocument.
 */
exports.indexAllDocs = (0, server_1.action)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var BASE, docs, results, _i, docs_1, doc, res, content, result, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    BASE = "https://raw.githubusercontent.com/jaydubya818/MissionControl/main/";
                    docs = [
                        { path: "docs/PRD_V2.md", title: "PRD V2" },
                        { path: "docs/APP_FLOW.md", title: "App Flow" },
                        { path: "docs/BACKEND_STRUCTURE.md", title: "Backend Structure" },
                        { path: "docs/FRONTEND_GUIDELINES.md", title: "Frontend Guidelines" },
                        { path: "docs/TECH_STACK.md", title: "Tech Stack" },
                        { path: "docs/ARCHITECTURE.md", title: "Architecture" },
                        { path: "docs/AGENT_GUIDE.md", title: "Agent Guide" },
                        { path: "docs/WORKFLOWS.md", title: "Workflows" },
                        { path: "docs/SECURITY_AUDIT.md", title: "Security Audit" },
                        { path: "docs/runbook/RUNBOOK.md", title: "Runbook" },
                        { path: "docs/guides/QUICK_START_NOW.md", title: "Quick Start" },
                        { path: "docs/planning/IMPLEMENTATION_PLAN.md", title: "Implementation Plan" },
                        { path: "docs/DECISIONS.md", title: "Decisions" },
                        { path: "docs/ROADMAP.md", title: "Roadmap" },
                    ];
                    results = [];
                    _i = 0, docs_1 = docs;
                    _a.label = 1;
                case 1:
                    if (!(_i < docs_1.length)) return [3 /*break*/, 8];
                    doc = docs_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 6, , 7]);
                    return [4 /*yield*/, fetch(BASE + doc.path)];
                case 3:
                    res = _a.sent();
                    if (!res.ok) {
                        results.push({ source: doc.path, chunks: 0, error: "HTTP ".concat(res.status) });
                        return [3 /*break*/, 7];
                    }
                    return [4 /*yield*/, res.text()];
                case 4:
                    content = _a.sent();
                    return [4 /*yield*/, ctx.runAction(api_1.api.knowledge.indexDocument, {
                            source: doc.path,
                            title: doc.title,
                            content: content,
                        })];
                case 5:
                    result = _a.sent();
                    results.push({ source: doc.path, chunks: result.chunks });
                    return [3 /*break*/, 7];
                case 6:
                    e_1 = _a.sent();
                    results.push({
                        source: doc.path,
                        chunks: 0,
                        error: e_1 instanceof Error ? e_1.message : String(e_1),
                    });
                    return [3 /*break*/, 7];
                case 7:
                    _i++;
                    return [3 /*break*/, 1];
                case 8: return [2 /*return*/, results];
            }
        });
    }); },
});
/**
 * Semantic search — returns top-k relevant chunks.
 */
exports.semanticSearch = (0, server_1.action)({
    args: {
        query: values_1.v.string(),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var apiKey, embedding, limit, results, chunks;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    apiKey = process.env.OPENAI_API_KEY;
                    if (!apiKey)
                        throw new Error("OPENAI_API_KEY not set in Convex env");
                    return [4 /*yield*/, embedText(apiKey, args.query)];
                case 1:
                    embedding = _b.sent();
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 8;
                    return [4 /*yield*/, ctx.vectorSearch("knowledgeChunks", "by_embedding", {
                            vector: embedding,
                            limit: limit,
                        })];
                case 2:
                    results = _b.sent();
                    return [4 /*yield*/, Promise.all(results.map(function (r) { return __awaiter(void 0, void 0, void 0, function () {
                            var doc;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, ctx.runQuery(api_1.api.knowledge.getChunkById, { id: r._id })];
                                    case 1:
                                        doc = _a.sent();
                                        return [2 /*return*/, doc ? __assign(__assign({}, doc), { score: r._score }) : null];
                                }
                            });
                        }); }))];
                case 3:
                    chunks = _b.sent();
                    return [2 /*return*/, chunks.filter(function (c) { return c != null; })];
            }
        });
    }); },
});
exports.getChunkById = (0, server_1.query)({
    args: { id: values_1.v.id("knowledgeChunks") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.id)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/**
 * RAG chat — answer a question using retrieved doc context.
 */
exports.chatWithRepo = (0, server_1.action)({
    args: {
        question: values_1.v.string(),
        sessionId: values_1.v.string(),
        history: values_1.v.optional(values_1.v.array(values_1.v.object({
            role: values_1.v.union(values_1.v.literal("user"), values_1.v.literal("assistant")),
            content: values_1.v.string(),
        }))),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var apiKey, embedding, results, chunks, context, sources, systemPrompt, messages, chatRes, _a, _b, chatData, answer;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    apiKey = process.env.OPENAI_API_KEY;
                    if (!apiKey)
                        throw new Error("OPENAI_API_KEY not set in Convex env");
                    return [4 /*yield*/, embedText(apiKey, args.question)];
                case 1:
                    embedding = _d.sent();
                    return [4 /*yield*/, ctx.vectorSearch("knowledgeChunks", "by_embedding", {
                            vector: embedding,
                            limit: 6,
                        })];
                case 2:
                    results = _d.sent();
                    return [4 /*yield*/, Promise.all(results.map(function (r) { return __awaiter(void 0, void 0, void 0, function () {
                            var doc;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, ctx.runQuery(api_1.api.knowledge.getChunkById, {
                                            id: r._id,
                                        })];
                                    case 1:
                                        doc = _a.sent();
                                        return [2 /*return*/, doc ? __assign(__assign({}, doc), { score: r._score }) : null];
                                }
                            });
                        }); }))];
                case 3:
                    chunks = (_d.sent()).filter(Boolean);
                    context = chunks
                        .map(function (c) { return "## ".concat(c.title, " (").concat(c.source, ")\n").concat(c.content); })
                        .join("\n\n---\n\n");
                    sources = chunks.map(function (c) { return ({
                        title: c.title,
                        source: c.source,
                        excerpt: c.content.slice(0, 200) + (c.content.length > 200 ? "…" : ""),
                    }); });
                    systemPrompt = "You are an expert assistant for the Mission Control project \u2014 an AI agent orchestration platform. \nAnswer questions using the provided documentation context. Be concise, technical, and accurate.\nIf the context doesn't contain enough information, say so rather than guessing.\n\nDOCUMENTATION CONTEXT:\n".concat(context);
                    messages = __spreadArray(__spreadArray([
                        { role: "system", content: systemPrompt }
                    ], ((_c = args.history) !== null && _c !== void 0 ? _c : []).map(function (m) { return ({
                        role: m.role,
                        content: m.content,
                    }); }), true), [
                        { role: "user", content: args.question },
                    ], false);
                    return [4 /*yield*/, fetch("https://api.openai.com/v1/chat/completions", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "Bearer ".concat(apiKey),
                            },
                            body: JSON.stringify({
                                model: CHAT_MODEL,
                                messages: messages,
                                temperature: 0.3,
                                max_tokens: 1024,
                            }),
                        })];
                case 4:
                    chatRes = _d.sent();
                    if (!!chatRes.ok) return [3 /*break*/, 6];
                    _a = Error.bind;
                    _b = "OpenAI chat error: ".concat;
                    return [4 /*yield*/, chatRes.text()];
                case 5: throw new (_a.apply(Error, [void 0, _b.apply("OpenAI chat error: ", [_d.sent()])]))();
                case 6: return [4 /*yield*/, chatRes.json()];
                case 7:
                    chatData = (_d.sent());
                    answer = chatData.choices[0].message.content;
                    // 4. Persist to history
                    return [4 /*yield*/, ctx.runMutation(api_1.api.knowledge.storeChatMessage, {
                            sessionId: args.sessionId,
                            role: "user",
                            content: args.question,
                        })];
                case 8:
                    // 4. Persist to history
                    _d.sent();
                    return [4 /*yield*/, ctx.runMutation(api_1.api.knowledge.storeChatMessage, {
                            sessionId: args.sessionId,
                            role: "assistant",
                            content: answer,
                            sources: sources,
                        })];
                case 9:
                    _d.sent();
                    return [2 /*return*/, { answer: answer, sources: sources }];
            }
        });
    }); },
});

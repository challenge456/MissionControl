"use strict";
/**
 * Voice Synthesis Functions
 *
 * Convex actions for TTS synthesis and voice artifact management.
 * Uses ElevenLabs as the first TTS provider; audio stored in Convex file storage.
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
exports.synthesize = exports.storeArtifact = exports.getArtifact = exports.listArtifacts = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
// ============================================================================
// QUERIES
// ============================================================================
/**
 * List voice artifacts for an agent or project.
 */
exports.listArtifacts = (0, server_1.query)({
    args: {
        agentId: values_1.v.optional(values_1.v.string()),
        projectId: values_1.v.optional(values_1.v.id("projects")),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 50;
                    if (!args.agentId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("voiceArtifacts")
                            .withIndex("by_agent", function (q) { return q.eq("agentId", args.agentId); })
                            .order("desc")
                            .take(limit)];
                case 1: return [2 /*return*/, _b.sent()];
                case 2:
                    if (!args.projectId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db
                            .query("voiceArtifacts")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .order("desc")
                            .take(limit)];
                case 3: return [2 /*return*/, _b.sent()];
                case 4: return [4 /*yield*/, ctx.db
                        .query("voiceArtifacts")
                        .order("desc")
                        .take(limit)];
                case 5: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
/**
 * Get a single voice artifact.
 */
exports.getArtifact = (0, server_1.query)({
    args: {
        artifactId: values_1.v.id("voiceArtifacts"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var artifact, audioUrl;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.artifactId)];
                case 1:
                    artifact = _b.sent();
                    if (!artifact)
                        return [2 /*return*/, null];
                    audioUrl = artifact.audioUrl;
                    if (!artifact.audioStorageId) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.storage.getUrl(artifact.audioStorageId)];
                case 2:
                    audioUrl = (_a = _b.sent()) !== null && _a !== void 0 ? _a : undefined;
                    _b.label = 3;
                case 3: return [2 /*return*/, __assign(__assign({}, artifact), { audioUrl: audioUrl })];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
/**
 * Store a voice artifact record.
 */
exports.storeArtifact = (0, server_1.mutation)({
    args: {
        agentId: values_1.v.optional(values_1.v.string()),
        projectId: values_1.v.optional(values_1.v.id("projects")),
        text: values_1.v.string(),
        transcript: values_1.v.optional(values_1.v.string()),
        audioUrl: values_1.v.optional(values_1.v.string()),
        audioStorageId: values_1.v.optional(values_1.v.string()),
        provider: values_1.v.union(values_1.v.literal("ELEVENLABS"), values_1.v.literal("OTHER")),
        voiceId: values_1.v.optional(values_1.v.string()),
        durationMs: values_1.v.optional(values_1.v.number()),
        linkedMessageId: values_1.v.optional(values_1.v.id("telegraphMessages")),
        linkedMeetingId: values_1.v.optional(values_1.v.id("meetings")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.insert("voiceArtifacts", __assign(__assign({}, args), { metadata: {} }))];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
// ============================================================================
// ACTIONS
// ============================================================================
/**
 * Synthesize speech using ElevenLabs and store the result.
 * Requires ELEVENLABS_API_KEY environment variable.
 */
exports.synthesize = (0, server_1.action)({
    args: {
        text: values_1.v.string(),
        agentId: values_1.v.optional(values_1.v.string()),
        projectId: values_1.v.optional(values_1.v.id("projects")),
        voiceId: values_1.v.optional(values_1.v.string()),
        modelId: values_1.v.optional(values_1.v.string()),
        stability: values_1.v.optional(values_1.v.number()),
        similarityBoost: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var apiKey, voiceId, modelId, response, errorBody, audioBlob, storageId, artifactId;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    apiKey = process.env.ELEVENLABS_API_KEY;
                    if (!apiKey) {
                        throw new Error("ELEVENLABS_API_KEY environment variable is required for voice synthesis");
                    }
                    voiceId = (_a = args.voiceId) !== null && _a !== void 0 ? _a : "21m00Tcm4TlvDq8ikWAM";
                    modelId = (_b = args.modelId) !== null && _b !== void 0 ? _b : "eleven_multilingual_v2";
                    return [4 /*yield*/, fetch("https://api.elevenlabs.io/v1/text-to-speech/".concat(voiceId), {
                            method: "POST",
                            headers: {
                                "xi-api-key": apiKey,
                                "Content-Type": "application/json",
                                Accept: "audio/mpeg",
                            },
                            body: JSON.stringify({
                                text: args.text,
                                model_id: modelId,
                                voice_settings: {
                                    stability: (_c = args.stability) !== null && _c !== void 0 ? _c : 0.5,
                                    similarity_boost: (_d = args.similarityBoost) !== null && _d !== void 0 ? _d : 0.75,
                                    style: 0,
                                    use_speaker_boost: true,
                                },
                            }),
                        })];
                case 1:
                    response = _e.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.text()];
                case 2:
                    errorBody = _e.sent();
                    throw new Error("ElevenLabs API error (".concat(response.status, "): ").concat(errorBody));
                case 3: return [4 /*yield*/, response.blob()];
                case 4:
                    audioBlob = _e.sent();
                    return [4 /*yield*/, ctx.storage.store(audioBlob)];
                case 5:
                    storageId = _e.sent();
                    return [4 /*yield*/, ctx.runMutation(
                        // @ts-expect-error -- internal reference
                        "voice:storeArtifact", {
                            agentId: args.agentId,
                            projectId: args.projectId,
                            text: args.text,
                            transcript: args.text,
                            audioStorageId: storageId,
                            provider: "ELEVENLABS",
                            voiceId: voiceId,
                        })];
                case 6:
                    artifactId = _e.sent();
                    return [2 /*return*/, {
                            artifactId: artifactId,
                            storageId: storageId,
                            characterCount: args.text.length,
                        }];
            }
        });
    }); },
});

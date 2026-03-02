"use strict";
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
exports.stop = exports.captureEvent = exports.start = exports.getBySession = exports.list = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
function buildSessionId() {
    return "rec_".concat(Math.random().toString(36).slice(2, 10));
}
function eventToPlaywright(event) {
    var _a, _b, _c, _d, _e, _f, _g;
    var type = (_a = event.eventType) !== null && _a !== void 0 ? _a : "unknown";
    var data = (_b = event.data) !== null && _b !== void 0 ? _b : {};
    if (type === "navigate")
        return "await page.goto('".concat(String((_c = data.url) !== null && _c !== void 0 ? _c : ""), "');");
    if (type === "click")
        return "await page.click('".concat(String((_d = data.selector) !== null && _d !== void 0 ? _d : ""), "');");
    if (type === "input") {
        return "await page.fill('".concat(String((_e = data.selector) !== null && _e !== void 0 ? _e : ""), "', '").concat(String((_f = data.value) !== null && _f !== void 0 ? _f : ""), "');");
    }
    if (type === "hover")
        return "await page.hover('".concat(String((_g = data.selector) !== null && _g !== void 0 ? _g : ""), "');");
    return "// Unsupported event: ".concat(type);
}
function eventsToGherkin(name, events) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var lines = ["Feature: ".concat(name), "  Recorded scenario", "", "  Scenario: ".concat(name)];
    for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
        var event_1 = events_1[_i];
        if (event_1.eventType === "navigate") {
            lines.push("    Given I navigate to \"".concat(String((_b = (_a = event_1.data) === null || _a === void 0 ? void 0 : _a.url) !== null && _b !== void 0 ? _b : ""), "\""));
        }
        else if (event_1.eventType === "click") {
            lines.push("    When I click \"".concat(String((_d = (_c = event_1.data) === null || _c === void 0 ? void 0 : _c.selector) !== null && _d !== void 0 ? _d : ""), "\""));
        }
        else if (event_1.eventType === "input") {
            lines.push("    And I enter \"".concat(String((_f = (_e = event_1.data) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : ""), "\" in \"").concat(String((_h = (_g = event_1.data) === null || _g === void 0 ? void 0 : _g.selector) !== null && _h !== void 0 ? _h : ""), "\""));
        }
    }
    lines.push("    Then the user flow should complete");
    return lines.join("\n");
}
exports.list = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        userId: values_1.v.optional(values_1.v.string()),
        status: values_1.v.optional(values_1.v.union(values_1.v.literal("RECORDING"), values_1.v.literal("COMPLETED"), values_1.v.literal("FAILED"), values_1.v.literal("CANCELED"))),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var runs, _a;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db.query("testRecordings").withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); }).order("desc").take((_b = args.limit) !== null && _b !== void 0 ? _b : 50)];
                case 1:
                    _a = _d.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("testRecordings").order("desc").take((_c = args.limit) !== null && _c !== void 0 ? _c : 50)];
                case 3:
                    _a = _d.sent();
                    _d.label = 4;
                case 4:
                    runs = _a;
                    return [2 /*return*/, runs.filter(function (run) {
                            if (args.userId && run.userId !== args.userId)
                                return false;
                            if (args.status && run.status !== args.status)
                                return false;
                            return true;
                        })];
            }
        });
    }); },
});
exports.getBySession = (0, server_1.query)({
    args: { sessionId: values_1.v.string() },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("testRecordings").withIndex("by_session", function (q) { return q.eq("sessionId", args.sessionId); }).first()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.start = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        userId: values_1.v.string(),
        url: values_1.v.optional(values_1.v.string()),
        name: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var sessionId, now, id;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    sessionId = buildSessionId();
                    now = Date.now();
                    return [4 /*yield*/, ctx.db.insert("testRecordings", {
                            tenantId: undefined,
                            projectId: args.projectId,
                            sessionId: sessionId,
                            userId: args.userId,
                            url: args.url,
                            status: "RECORDING",
                            events: [],
                            startedAt: now,
                            metadata: { name: (_a = args.name) !== null && _a !== void 0 ? _a : "Recorded flow" },
                        })];
                case 1:
                    id = _b.sent();
                    return [2 /*return*/, { id: id, sessionId: sessionId }];
            }
        });
    }); },
});
exports.captureEvent = (0, server_1.mutation)({
    args: {
        sessionId: values_1.v.string(),
        eventType: values_1.v.string(),
        data: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var recording, events;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.query("testRecordings").withIndex("by_session", function (q) { return q.eq("sessionId", args.sessionId); }).first()];
                case 1:
                    recording = _b.sent();
                    if (!recording)
                        throw new Error("Recording session not found");
                    if (recording.status !== "RECORDING")
                        throw new Error("Recording session is not active");
                    events = __spreadArray(__spreadArray([], recording.events, true), [{ eventType: args.eventType, data: (_a = args.data) !== null && _a !== void 0 ? _a : {}, timestamp: Date.now() }], false);
                    return [4 /*yield*/, ctx.db.patch(recording._id, { events: events })];
                case 2:
                    _b.sent();
                    return [2 /*return*/, { success: true, totalEvents: events.length }];
            }
        });
    }); },
});
exports.stop = (0, server_1.mutation)({
    args: { sessionId: values_1.v.string() },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var recording, typedEvents, playwrightCode, gherkinScenario;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, ctx.db.query("testRecordings").withIndex("by_session", function (q) { return q.eq("sessionId", args.sessionId); }).first()];
                case 1:
                    recording = _c.sent();
                    if (!recording)
                        throw new Error("Recording session not found");
                    typedEvents = recording.events;
                    playwrightCode = typedEvents.map(eventToPlaywright);
                    gherkinScenario = eventsToGherkin(String((_b = (_a = recording.metadata) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : recording.sessionId), typedEvents);
                    return [4 /*yield*/, ctx.db.patch(recording._id, {
                            status: "COMPLETED",
                            completedAt: Date.now(),
                            playwrightCode: playwrightCode,
                            gherkinScenario: gherkinScenario,
                        })];
                case 2:
                    _c.sent();
                    return [2 /*return*/, { success: true, sessionId: args.sessionId, playwrightCode: playwrightCode, gherkinScenario: gherkinScenario }];
            }
        });
    }); },
});

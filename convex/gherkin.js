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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.generateFromApiSteps = exports.generateFromRecording = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
function toGherkinFromEvents(events, name) {
    var _a, _b, _c, _d, _e, _f, _g;
    var lines = [
        "Feature: ".concat(name),
        "  Auto-generated from recorded interactions",
        "",
        "  Scenario: ".concat(name),
    ];
    for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
        var event_1 = events_1[_i];
        var type = (_a = event_1.eventType) !== null && _a !== void 0 ? _a : "unknown";
        var data = (_b = event_1.data) !== null && _b !== void 0 ? _b : {};
        if (type === "navigate") {
            lines.push("    Given I navigate to \"".concat(String((_c = data.url) !== null && _c !== void 0 ? _c : ""), "\""));
        }
        else if (type === "click") {
            lines.push("    When I click on \"".concat(String((_d = data.selector) !== null && _d !== void 0 ? _d : "element"), "\""));
        }
        else if (type === "input") {
            lines.push("    And I enter \"".concat(String((_e = data.value) !== null && _e !== void 0 ? _e : ""), "\" in \"").concat(String((_f = data.selector) !== null && _f !== void 0 ? _f : "field"), "\""));
        }
        else if (type === "hover") {
            lines.push("    And I hover over \"".concat(String((_g = data.selector) !== null && _g !== void 0 ? _g : "element"), "\""));
        }
        else {
            lines.push("    And I perform ".concat(type));
        }
    }
    lines.push("    Then the workflow completes successfully");
    return lines.join("\n");
}
function toGherkinFromApiSteps(steps, name) {
    var _a, _b;
    var lines = [
        "Feature: ".concat(name),
        "  Auto-generated from API test definitions",
        "",
        "  Scenario: ".concat(name),
    ];
    for (var _i = 0, steps_1 = steps; _i < steps_1.length; _i++) {
        var step = steps_1[_i];
        var method = String((_a = step.method) !== null && _a !== void 0 ? _a : "GET");
        var url = String((_b = step.url) !== null && _b !== void 0 ? _b : "/");
        lines.push("    When I call \"".concat(method, " ").concat(url, "\""));
    }
    lines.push("    Then the responses should meet assertions");
    return lines.join("\n");
}
exports.generateFromRecording = (0, server_1.action)({
    args: {
        name: values_1.v.string(),
        events: values_1.v.array(values_1.v.object({ eventType: values_1.v.optional(values_1.v.string()), data: values_1.v.optional(values_1.v.any()) })),
    },
    handler: function (_ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, { gherkin: toGherkinFromEvents(args.events, args.name) }];
        });
    }); },
});
exports.generateFromApiSteps = (0, server_1.action)({
    args: {
        name: values_1.v.string(),
        steps: values_1.v.array(values_1.v.any()),
    },
    handler: function (_ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, { gherkin: toGherkinFromApiSteps(args.steps, args.name) }];
        });
    }); },
});
exports.parse = (0, server_1.action)({
    args: { gherkin: values_1.v.string() },
    handler: function (_ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var lines;
        return __generator(this, function (_a) {
            lines = args.gherkin
                .split("\n")
                .map(function (line) { return line.trim(); })
                .filter(Boolean);
            return [2 /*return*/, {
                    steps: lines.filter(function (line) { return line.startsWith("Given") || line.startsWith("When") || line.startsWith("And") || line.startsWith("Then"); }),
                    lineCount: lines.length,
                }];
        });
    }); },
});

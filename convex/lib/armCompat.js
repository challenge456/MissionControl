"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isArmCompatMode = isArmCompatMode;
exports.preferInstanceRefs = preferInstanceRefs;
function isArmCompatMode() {
    var _a;
    var raw = ((_a = process.env.ARM_COMPAT_MODE) !== null && _a !== void 0 ? _a : "true").toLowerCase();
    return raw !== "false" && raw !== "0";
}
function preferInstanceRefs() {
    return !isArmCompatMode();
}

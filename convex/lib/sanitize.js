"use strict";
/**
 * Input sanitization for untrusted DM/webhook input.
 * OpenClaw-aligned: treat inbound DMs and webhook payloads as untrusted.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeTaskTitle = sanitizeTaskTitle;
exports.sanitizeTaskDescription = sanitizeTaskDescription;
exports.sanitizeMessageContent = sanitizeMessageContent;
var MAX_TITLE_LENGTH = 500;
var MAX_DESCRIPTION_LENGTH = 50000;
var MAX_MESSAGE_CONTENT_LENGTH = 10000;
/** Strip control characters (0x00-0x1F except \t \n \r) */
function stripControlChars(s) {
    return s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");
}
/** Truncate to max length and strip control chars */
function sanitizeText(input, maxLength, trim) {
    if (trim === void 0) { trim = true; }
    if (typeof input !== "string")
        return "";
    var out = stripControlChars(input);
    if (trim)
        out = out.trim();
    if (out.length > maxLength)
        out = out.slice(0, maxLength);
    return out;
}
/**
 * Sanitize task title from external source (Telegram, GitHub, API).
 */
function sanitizeTaskTitle(title) {
    return sanitizeText(title, MAX_TITLE_LENGTH);
}
/**
 * Sanitize task description from external source.
 */
function sanitizeTaskDescription(description) {
    if (description == null || description === "")
        return undefined;
    return sanitizeText(description, MAX_DESCRIPTION_LENGTH);
}
/**
 * Sanitize message content (e.g. thread reply from Telegram).
 */
function sanitizeMessageContent(content) {
    return sanitizeText(content, MAX_MESSAGE_CONTENT_LENGTH);
}

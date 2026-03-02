"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateLegacyToolPolicy = evaluateLegacyToolPolicy;
var riskClassifier_1 = require("./riskClassifier");
function matchesGlob(path, pattern) {
    var regexPattern = pattern
        .replace(/\*\*/g, ".*")
        .replace(/\*/g, "[^/]*")
        .replace(/\./g, "\\.");
    var regex = new RegExp("^".concat(regexPattern, "$"));
    return regex.test(path);
}
function checkShellAllowlist(command, policy) {
    var cmd = command.trim().toLowerCase();
    var blocklist = policy.shellBlocklist || [];
    var allowlist = policy.shellAllowlist || [];
    for (var _i = 0, blocklist_1 = blocklist; _i < blocklist_1.length; _i++) {
        var blocked = blocklist_1[_i];
        if (cmd.includes(blocked.toLowerCase())) {
            return {
                allowed: false,
                reason: "Command contains blocked pattern: ".concat(blocked),
            };
        }
    }
    if (allowlist.length === 0)
        return { allowed: true };
    for (var _a = 0, allowlist_1 = allowlist; _a < allowlist_1.length; _a++) {
        var allowed = allowlist_1[_a];
        if (cmd.startsWith(allowed.toLowerCase())) {
            return { allowed: true };
        }
    }
    return {
        allowed: false,
        reason: "Command not in allowlist",
    };
}
function checkNetworkAllowlist(url, policy) {
    try {
        var hostname = new URL(url).hostname.toLowerCase();
        var allowlist = policy.networkAllowlist || [];
        if (allowlist.length === 0)
            return { allowed: true };
        for (var _i = 0, allowlist_2 = allowlist; _i < allowlist_2.length; _i++) {
            var allowed = allowlist_2[_i];
            if (hostname === allowed.toLowerCase() || hostname.endsWith(".".concat(allowed.toLowerCase()))) {
                return { allowed: true };
            }
        }
        return {
            allowed: false,
            reason: "Domain ".concat(hostname, " not in allowlist"),
        };
    }
    catch (_a) {
        return {
            allowed: false,
            reason: "Invalid URL",
        };
    }
}
function checkFileReadAllowlist(path, policy) {
    var normalizedPath = path.trim().toLowerCase();
    var allowlist = policy.fileReadPaths || [];
    if (allowlist.length === 0)
        return { allowed: true };
    for (var _i = 0, allowlist_3 = allowlist; _i < allowlist_3.length; _i++) {
        var pattern = allowlist_3[_i];
        if (matchesGlob(normalizedPath, pattern.toLowerCase())) {
            return { allowed: true };
        }
    }
    return {
        allowed: false,
        reason: "Path ".concat(path, " not in read allowlist"),
    };
}
function checkFileWriteAllowlist(path, policy) {
    var normalizedPath = path.trim().toLowerCase();
    var allowlist = policy.fileWritePaths || [];
    if (allowlist.length === 0)
        return { allowed: true };
    for (var _i = 0, allowlist_4 = allowlist; _i < allowlist_4.length; _i++) {
        var pattern = allowlist_4[_i];
        if (matchesGlob(normalizedPath, pattern.toLowerCase())) {
            return { allowed: true };
        }
    }
    return {
        allowed: false,
        reason: "Path ".concat(path, " not in write allowlist"),
    };
}
function checkAllowlists(toolName, toolArgs, policy) {
    var args = (toolArgs !== null && toolArgs !== void 0 ? toolArgs : {});
    if (toolName === "shell" || toolName === "exec" || toolName === "bash") {
        var command = typeof args.command === "string" ? args.command : typeof args.cmd === "string" ? args.cmd : "";
        return checkShellAllowlist(command, policy);
    }
    if (toolName === "web_fetch" || toolName === "http" || toolName === "fetch") {
        var url = typeof args.url === "string" ? args.url : "";
        return checkNetworkAllowlist(url, policy);
    }
    if (toolName === "read" || toolName === "read_file") {
        var path = typeof args.path === "string" ? args.path : "";
        return checkFileReadAllowlist(path, policy);
    }
    if (toolName === "write" || toolName === "write_file" || toolName === "edit") {
        var path = typeof args.path === "string" ? args.path : "";
        return checkFileWriteAllowlist(path, policy);
    }
    return { allowed: true };
}
function evaluateLegacyToolPolicy(args) {
    var risk = (0, riskClassifier_1.classifyRisk)(args.toolName, args.toolArgs);
    if (!args.policy) {
        return {
            decision: "ALLOW",
            reason: "No active legacy policy found",
            riskLevel: risk,
        };
    }
    var allowlistCheck = checkAllowlists(args.toolName, args.toolArgs, args.policy);
    if (!allowlistCheck.allowed) {
        return {
            decision: "DENY",
            reason: allowlistCheck.reason || "Action blocked by allowlist",
            riskLevel: "RED",
        };
    }
    var approvalCheck = (0, riskClassifier_1.requiresApproval)(risk, args.agentRole, args.estimatedCost, args.budgetRemaining);
    if (approvalCheck.required) {
        return {
            decision: "NEEDS_APPROVAL",
            reason: approvalCheck.reason,
            riskLevel: risk,
        };
    }
    return {
        decision: "ALLOW",
        reason: "Legacy policy allows ".concat(args.toolName, " for ").concat(args.agentRole),
        riskLevel: risk,
    };
}

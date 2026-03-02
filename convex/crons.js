"use strict";
/**
 * Convex Cron Jobs
 *
 * - Expire stale approvals every 15 minutes
 * - Detect loops every 15 minutes
 * - Daily standup report at 09:00 UTC
 * - Daily CEO brief to Telegram at 09:00 UTC
 */
Object.defineProperty(exports, "__esModule", { value: true });
var server_1 = require("convex/server");
var api_1 = require("./_generated/api");
var crons = (0, server_1.cronJobs)();
// Expire approvals past their expiresAt every 15 minutes
crons.interval("expire stale approvals", { minutes: 15 }, api_1.api.approvals.expireStale);
// Escalate pending approvals breaching SLA every 10 minutes
crons.interval("escalate overdue approvals", { minutes: 10 }, api_1.api.approvals.escalateOverdue, {});
// Detect loops (comment storms, review ping-pong, repeated failures) every 15 minutes
crons.interval("detect loops", { minutes: 15 }, api_1.internal.loops.detectLoops);
// Daily standup report at 09:00 UTC
crons.daily("daily standup report", { hourUTC: 9, minuteUTC: 0 }, api_1.api.standup.runDaily);
// Daily CEO brief to Telegram at 09:00 UTC
crons.daily("daily CEO brief", { hourUTC: 9, minuteUTC: 0 }, api_1.internal.telegram.prepareDailyCEOBrief);
// Detect stale agent heartbeats every 2 minutes (runs no-op unless HEARTBEAT_RECOVERY_ENABLED=true in Convex env)
// Recovery: quarantine agent, block tasks, create alerts. Threshold: HEARTBEAT_STALE_MINUTES (default 5).
// Set HEARTBEAT_IGNORE_NEVER=true to skip agents that have never sent a heartbeat.
crons.interval("detect stale heartbeats", { minutes: 2 }, api_1.internal.agents.detectStaleAgents);
// Auto-route execution requests every 5 minutes
crons.interval("auto-route executions", { minutes: 5 }, api_1.internal.executorRouter.autoRoute);
// Guard against migration drift (missing instance refs or tenant IDs) every 30 minutes
crons.interval("guard ARM migration health", { minutes: 30 }, api_1.internal.migrations.backfillInstanceRefs.guardMigrationHealth);
// Execute due scheduled jobs every minute
crons.interval("execute scheduled jobs", { minutes: 1 }, api_1.internal.scheduledJobs.executeDue);
// Evaluate alert rules (e.g. daily cost exceeded) every hour
crons.interval("evaluate alert rules", { hours: 1 }, api_1.internal.alertRules.evaluateRules);
exports.default = crons;

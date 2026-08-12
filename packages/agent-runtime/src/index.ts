/**
 * Mission Control Agent Runtime
 * 
 * Full agent lifecycle management with persona loading.
 * Evolves from packages/agent-runner with:
 *   - YAML persona loading and validation
 *   - Configurable heartbeat with recovery
 *   - Task claiming and state machine integration
 *   - Budget tracking and enforcement
 *   - Error streak management
 */

export { loadPersona, validatePersona, type AgentPersona } from "./persona.js";
export { AgentLifecycle, type AgentLifecycleConfig } from "./lifecycle.js";
export { HeartbeatMonitor, type HeartbeatConfig } from "./heartbeat.js";

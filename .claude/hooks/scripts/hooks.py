#!/usr/bin/env python3
"""
Claude Code Hooks - Audio + Notification Handler
/Users/jaywest/MissionControl/.claude/hooks/scripts/hooks.py

Plays macOS system sounds and shows notifications on Claude Code lifecycle events.
Fails silently so it never blocks Claude Code.

Event → Sound mapping:
  SessionStart   → Ping       (startup chime)
  SessionEnd     → Glass      (session closed)
  Stop           → Hero       (task complete) + notification
  Notification   → Pop        (heads up)      + notification
  PreCompact     → Funk       (warning)        + notification
  SubagentStart  → Tink       (agent spawned)
  SubagentStop   → Submarine  (agent finished)
  Setup          → Bottle     (setup phase)
  git commit     → Morse      (special: fires on PreToolUse Bash git commit)
"""

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

SOUNDS_DIR = Path("/System/Library/Sounds")
LOG_FILE = Path(__file__).parent.parent / "logs" / "hooks.jsonl"

SOUND_MAP: dict[str, str | None] = {
    "SessionStart":      "Ping",
    "SessionEnd":        "Glass",
    "Stop":              "Hero",
    "Notification":      "Pop",
    "PreCompact":        "Funk",
    "SubagentStart":     "Tink",
    "SubagentStop":      "Submarine",
    "Setup":             "Bottle",
    "UserPromptSubmit":  None,   # silent — too frequent
    "PreToolUse":        None,   # handled below
    "PostToolUse":       None,   # silent
    "PermissionRequest": "Basso",
}

GIT_COMMIT_RE = re.compile(r"\bgit\s+commit\b")

# ── Helpers ───────────────────────────────────────────────────────────────────

def play(name: str) -> None:
    path = SOUNDS_DIR / f"{name}.aiff"
    if not path.exists():
        return
    subprocess.Popen(
        ["afplay", str(path)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def notify(title: str, message: str) -> None:
    safe_msg = message.replace('"', "'").replace("\\", "\\\\")[:200]
    safe_title = title.replace('"', "'")
    subprocess.Popen(
        ["osascript", "-e", f'display notification "{safe_msg}" with title "{safe_title}"'],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def log(event_type: str, data: dict) -> None:
    try:
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        # Strip tool_response — can be huge
        slim = {k: v for k, v in data.items() if k != "tool_response"}
        entry = {"ts": datetime.now(timezone.utc).isoformat(), "event": event_type, **slim}
        with open(LOG_FILE, "a") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception:
        pass

# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    # Parse stdin
    try:
        raw = sys.stdin.read()
        data: dict = json.loads(raw) if raw.strip() else {}
    except Exception:
        data = {}

    # Determine event type — Claude Code sets hook_event_name in the payload
    event_type: str = data.get(
        "hook_event_name",
        os.environ.get("CLAUDE_CODE_HOOK_TYPE", "Unknown"),
    )

    log(event_type, data)

    # ── Special cases ────────────────────────────────────────────────────────

    if event_type == "PreToolUse":
        tool_name = data.get("tool_name", "")
        tool_input = data.get("tool_input", {})
        command = tool_input.get("command", "") if isinstance(tool_input, dict) else ""
        if tool_name == "Bash" and GIT_COMMIT_RE.search(command):
            play("Morse")
        return

    if event_type == "Stop":
        play("Hero")
        notify("Claude Code ✅", "Task complete")
        return

    if event_type == "Notification":
        message = data.get("message", "")
        play("Pop")
        if message:
            notify("Claude Code 🔔", message)
        return

    if event_type == "PreCompact":
        play("Funk")
        notify("Claude Code ⚠️", "Context compacting — consider /compact")
        return

    if event_type == "PermissionRequest":
        tool = data.get("tool_name", "tool")
        play("Basso")
        notify("Claude Code 🔐", f"Permission request: {tool}")
        return

    # ── Default sound map ────────────────────────────────────────────────────

    sound = SOUND_MAP.get(event_type)
    if sound:
        play(sound)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass  # Never crash — hooks must exit cleanly

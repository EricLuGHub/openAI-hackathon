#!/usr/bin/env python3
"""Produce stable command/tool/token telemetry from Codex's evolving JSONL schema."""

import argparse
import json
from pathlib import Path


def walk(value, path=()):
    if isinstance(value, dict):
        for key, child in value.items():
            yield from walk(child, path + (str(key),))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from walk(child, path + (str(index),))
    else:
        yield path, value


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("events", type=Path)
    parser.add_argument("commands", type=Path)
    parser.add_argument("summary", type=Path)
    args = parser.parse_args()
    events, malformed = [], 0
    for line in args.events.read_text(errors="replace").splitlines():
        try:
            events.append(json.loads(line))
        except json.JSONDecodeError:
            malformed += 1

    commands, tool_counts, token_values = [], {}, {}
    for event in events:
        event_type = str(event.get("type", "unknown"))
        tool_counts[event_type] = tool_counts.get(event_type, 0) + 1
        for path, value in walk(event):
            leaf = path[-1].lower() if path else ""
            dotted = ".".join(path).lower()
            if isinstance(value, str) and leaf in {"command", "cmd"}:
                commands.append(value)
            if isinstance(value, (int, float)) and "token" in leaf:
                token_values[dotted] = max(token_values.get(dotted, 0), value)

    args.commands.write_text("\n\n".join(commands) + ("\n" if commands else ""))
    summary = {
        "event_count": len(events),
        "malformed_event_lines": malformed,
        "command_count": len(commands),
        "event_types": tool_counts,
        "reported_token_fields": token_values,
    }
    args.summary.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Scope-guard PreToolUse hook for the Perspektifler micro-focus contract.

Blocks Edit/Write to repo files outside .claude/scope-allowlist.txt.
Exit 0 = allow, exit 2 = block (stderr returned to the agent).
Kill switch: create .claude/scope-guard.off to disable.
Paths outside the repo root (user docs, /tmp, plan files) are not guarded.
"""

import fnmatch
import json
import os
import sys


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0  # malformed input: never brick the session

    tool = payload.get("tool_name", "")
    if tool not in ("Edit", "Write", "MultiEdit", "NotebookEdit"):
        return 0

    file_path = (payload.get("tool_input") or {}).get("file_path") or ""
    if not file_path:
        return 0

    repo = payload.get("cwd") or os.getcwd()
    allowlist_path = os.path.join(repo, ".claude", "scope-allowlist.txt")
    if os.path.exists(os.path.join(repo, ".claude", "scope-guard.off")):
        return 0
    if not os.path.isfile(allowlist_path):
        return 0  # no fence configured

    abs_target = os.path.realpath(file_path)
    abs_repo = os.path.realpath(repo)
    if not abs_target.startswith(abs_repo + os.sep):
        return 0  # outside repo: user-level docs are not fenced

    rel = os.path.relpath(abs_target, abs_repo)

    patterns = []
    with open(allowlist_path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line and not line.startswith("#"):
                patterns.append(line)

    for pat in patterns:
        if pat.endswith("/**"):
            if rel == pat[:-3] or rel.startswith(pat[:-3] + "/"):
                return 0
        if fnmatch.fnmatch(rel, pat):
            return 0

    sys.stderr.write(
        f"SCOPE-GUARD: '{rel}' is outside the Perspektifler allowlist "
        f"(.claude/scope-allowlist.txt). Per SCOPE.md, either log the need in "
        f"OUT_OF_SCOPE.md and continue elsewhere, or expand the allowlist with "
        f"evidence + a PROGRESS.md entry first.\n"
    )
    return 2


if __name__ == "__main__":
    sys.exit(main())

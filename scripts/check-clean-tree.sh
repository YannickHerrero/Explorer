#!/usr/bin/env bash
# Refuse to proceed unless on master with a clean working tree.
set -euo pipefail

branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$branch" != "master" ]]; then
    echo "ERROR: must be on master (current: $branch)" >&2
    exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "ERROR: working tree has uncommitted changes" >&2
    git status --short >&2
    exit 1
fi

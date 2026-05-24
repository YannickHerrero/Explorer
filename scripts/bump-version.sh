#!/usr/bin/env bash
# Bump the version in package.json, src-tauri/Cargo.toml, and
# src-tauri/tauri.conf.json. Prints the new version to stdout.
# Usage: ./scripts/bump-version.sh [patch|minor|major] [--dry-run]
set -euo pipefail

bump="patch"
dry_run=0
for arg; do
    case "$arg" in
        --dry-run) dry_run=1 ;;
        patch|minor|major) bump="$arg" ;;
        *) echo "unknown arg: $arg (expected patch|minor|major or --dry-run)" >&2; exit 1 ;;
    esac
done

root="$(dirname "$0")/.."
pkg="$root/package.json"
cargo="$root/src-tauri/Cargo.toml"
conf="$root/src-tauri/tauri.conf.json"

# Read current from package.json — the three files are kept in lockstep, so any
# of them works as a source of truth.
current=$(grep -m1 '"version"' "$pkg" | sed -E 's/.*"version"\s*:\s*"([^"]+)".*/\1/')
IFS=. read -r maj min pat <<<"$current"

case "$bump" in
    patch) pat=$((pat + 1)) ;;
    minor) min=$((min + 1)); pat=0 ;;
    major) maj=$((maj + 1)); min=0; pat=0 ;;
esac

new="$maj.$min.$pat"
if [[ $dry_run -eq 0 ]]; then
    # package.json: match the first "version" key (top-level), which is on its own line.
    sed -i -E "0,/\"version\"\\s*:\\s*\"$current\"/{s/\"version\"\\s*:\\s*\"$current\"/\"version\": \"$new\"/}" "$pkg"
    # src-tauri/Cargo.toml: only the top-level [package] version line starts with `version = `.
    sed -i -E "s/^version = \"$current\"$/version = \"$new\"/" "$cargo"
    # src-tauri/tauri.conf.json: top-level "version".
    sed -i -E "0,/\"version\"\\s*:\\s*\"$current\"/{s/\"version\"\\s*:\\s*\"$current\"/\"version\": \"$new\"/}" "$conf"
fi
echo "$new"

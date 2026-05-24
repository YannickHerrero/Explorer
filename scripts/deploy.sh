#!/usr/bin/env bash
# Cut a release: bump version, run checks, commit, tag, push.
# The GitHub workflow at .github/workflows/release.yml fires on the new v* tag
# and builds the Windows installer.
# Usage:
#   ./scripts/deploy.sh                    -> interactive (prompts for bump + confirm)
#   ./scripts/deploy.sh patch|minor|major  -> non-interactive
set -euo pipefail

bump="${1:-}"
here="$(dirname "$0")"

if [[ -z "$bump" ]]; then
    if [[ ! -t 0 ]]; then
        echo "ERROR: no bump type given and stdin is not a terminal." >&2
        echo "Run: make deploy BUMP=patch|minor|major" >&2
        exit 1
    fi
    read -rp "Bump type [patch/minor/major] (default: patch): " bump
    bump="${bump:-patch}"
fi

case "$bump" in
    patch|minor|major) ;;
    *) echo "ERROR: invalid bump type: $bump" >&2; exit 1 ;;
esac

"$here/check-clean-tree.sh"

current=$(grep -m1 '"version"' "$here/../package.json" | sed -E 's/.*"version"\s*:\s*"([^"]+)".*/\1/')
new=$("$here/bump-version.sh" "$bump" --dry-run)

echo
echo "  Current: v$current"
echo "  Bump:    $bump"
echo "  New:     v$new"
echo

if [[ -t 0 ]]; then
    read -rp "Proceed? [Y/n] " ans
    case "${ans:-y}" in
        y|Y|yes|YES) ;;
        *) echo "Aborted."; exit 0 ;;
    esac
fi

"$here/bump-version.sh" "$bump" >/dev/null

# Sanity-check the bump compiles before we tag-and-push.
echo "Running TypeScript check..."
bunx tsc --noEmit
echo "Running cargo check (Windows target)..."
cargo check --manifest-path src-tauri/Cargo.toml --target x86_64-pc-windows-gnu --offline

git add package.json src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json
git commit -m "release: v$new"
git tag -a "v$new" -m "v$new"
git push origin master
git push origin "v$new"
echo "Pushed v$new — the release workflow should build the Windows installer."

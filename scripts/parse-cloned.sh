#!/usr/bin/env bash
# Clone-based Tree-sitter parsing helper.
#
# This script clones official language grammar repositories (if not already present)
# into a local directory (.parsers by default) and then invokes the Tree-sitter CLI
# from inside the appropriate language repo to parse the target file.
#
# Supported extensions (initial): js, jsx, ts, tsx, py, json, rs
# Extend by adding entries to the CASE block below.
#
# Usage:
#   ./scripts/parse-cloned.sh path/to/file
#   ./scripts/parse-cloned.sh --update path/to/file   # git pull latest for grammar repo
#   ./scripts/parse-cloned.sh --list                  # list locally cloned grammars
#
# Requirements: bash, git, tree-sitter CLI
set -euo pipefail

PARSER_ROOT=".parsers"
UPDATE=false
LIST=false
TARGET=""

mkdir -p "$PARSER_ROOT"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --update) UPDATE=true; shift;;
    --list) LIST=true; shift;;
    -h|--help)
      grep '^# ' "$0" | sed 's/^# \{0,1\}//'; exit 0;;
    *)
      if [[ -z "$TARGET" ]]; then TARGET="$1"; else echo "Extra argument: $1" >&2; exit 1; fi
      shift;;
  esac
done

if $LIST; then
  echo "Cloned grammar repositories:"; ls -1 "$PARSER_ROOT" || true; exit 0
fi

if [[ -z "$TARGET" ]]; then echo "Error: no target file provided" >&2; exit 1; fi
if [[ ! -f "$TARGET" ]]; then echo "Error: file not found: $TARGET" >&2; exit 1; fi

EXT="${TARGET##*.}"
LANG_REPO=""
REPO_DIR=""

case "$EXT" in
  js|jsx|ts|tsx)
    LANG_REPO="https://github.com/tree-sitter/tree-sitter-javascript.git"
    REPO_DIR="tree-sitter-javascript";;
  py)
    LANG_REPO="https://github.com/tree-sitter/tree-sitter-python.git"
    REPO_DIR="tree-sitter-python";;
  json)
    LANG_REPO="https://github.com/tree-sitter/tree-sitter-json.git"
    REPO_DIR="tree-sitter-json";;
  rs)
    LANG_REPO="https://github.com/tree-sitter/tree-sitter-rust.git"
    REPO_DIR="tree-sitter-rust";;
  *)
    echo "Unsupported extension: .$EXT" >&2
    echo "Edit scripts/parse-cloned.sh to add a repo mapping." >&2
    exit 2;;
esac

CLONE_PATH="$PARSER_ROOT/$REPO_DIR"
if [[ ! -d "$CLONE_PATH" ]]; then
  echo "Cloning $LANG_REPO -> $CLONE_PATH" >&2
  git clone --depth 1 "$LANG_REPO" "$CLONE_PATH"
fi

if $UPDATE; then
  echo "Updating $REPO_DIR" >&2
  (cd "$CLONE_PATH" && git pull --ff-only || true)
fi

# Generate (safe even if already generated)
(
  cd "$CLONE_PATH"
  tree-sitter generate >/dev/null 2>&1 || tree-sitter generate
  tree-sitter parse "$(realpath "$TARGET")"
)

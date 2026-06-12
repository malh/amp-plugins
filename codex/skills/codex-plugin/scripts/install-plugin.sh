#!/usr/bin/env sh
set -eu

PLUGIN_DIR="${HOME}/.config/amp/plugins"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
CODEX_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)

mkdir -p "$PLUGIN_DIR"
ln -sf "$CODEX_DIR/codex.ts" "$PLUGIN_DIR/codex.ts"

printf 'Installed codex.ts into %s\n' "$PLUGIN_DIR"
printf 'Reload Amp plugins with: plugins: reload\n'

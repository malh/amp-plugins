#!/usr/bin/env sh
set -eu

command -v codex >/dev/null
codex --version
codex login status

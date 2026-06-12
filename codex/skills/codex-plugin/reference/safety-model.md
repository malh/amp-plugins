# Safety Model

The Codex plugin exposes a delegated CLI agent. It does not replace Amp's main agent loop.

## Status

- `🟢 codex: <effort>` means the delegated Codex CLI tool is available.
- `⚪ codex: off` means the Codex CLI tool is hidden.

The status does not describe the active Amp mode. Codex delegation can be available from `smart`, `deep`, `rush`, or another mode.

## Read-only default

Codex should run read-only unless there is a clear reason to let it write.

Workspace writes require both:

1. `codex.allowWrite=true` in Amp configuration.
2. A Codex tool request that explicitly asks for `workspace-write`.

## Integration responsibility

Amp must not treat Codex output as authoritative.

Amp should:

- inspect relevant files before applying a recommendation
- reject suggestions that are outside the user's scope
- avoid broad refactors unless requested
- run focused verification after changes
- be clear when Codex output could not be verified

## Cancellation

Stopping an Amp turn may not stop an in-flight Codex CLI process. Avoid long Codex runs unless the task warrants them.

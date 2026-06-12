# Codex Amp Plugin

Expose your local Codex CLI / ChatGPT subscription to Amp as an optional `codex` tool.

The plugin adds a compact status item:

```text
🟢 codex: high
```

or:

```text
⚪ codex: off
```

- `🟢 codex: <effort>` means the delegated Codex CLI tool is available.
- `⚪ codex: off` means Amp can still use `smart`, `deep`, or `rush` normally, but the Codex CLI tool is not exposed.

Codex mode is independent of the active Amp mode. You can delegate to Codex from `smart`, `deep`, `rush`, or another mode when Codex mode is enabled.

## Requirements

- Amp with plugin support enabled.
- Codex CLI on `PATH`.
- Codex CLI authenticated with `codex login`.
- macOS, Linux, or WSL.

## Install

Copy or symlink the plugin into Amp's user plugin directory:

```sh
mkdir -p ~/.config/amp/plugins
ln -sf "$PWD/codex.ts" ~/.config/amp/plugins/codex.ts
```

Then reload plugins from Amp's command palette with `plugins: reload`, or restart Amp.

## Commands

- `codex: Toggle Codex mode` — expose or hide the Codex CLI tool.
- `codex: Set Codex effort` — choose `low`, `medium`, `high`, or `xhigh`.
- `codex: Check Codex CLI auth and settings` — verify the Codex CLI and current plugin settings.

## Tool

When Codex mode is enabled, the plugin registers a `codex` tool. Ask Amp to use it when you want GPT-5.5 via your Codex CLI subscription, for example:

```text
Use codex to review this plan. Keep it read-only.
```

By default, Codex runs read-only. Workspace writes are allowed only when `codex.allowWrite` is set to `true` in Amp config and the tool call requests `workspace-write`.

## Configuration

All config keys are optional:

| Key | Values | Default | Purpose |
| --- | --- | --- | --- |
| `codex.enabled` | `true`, `false` | `true` | Exposes or hides the delegated Codex CLI tool. |
| `codex.effort` | `low`, `medium`, `high`, `xhigh` | `high` | Reasoning effort passed to `codex exec`. |
| `codex.allowWrite` | `true`, `false` | `false` | Allows `workspace-write` Codex runs when explicitly requested. |

## Notes

This is not a selectable Amp mode. Amp's plugin API can register custom model-backed modes, but those do not use the local Codex CLI subscription path. This plugin keeps Codex usage subscription-backed by invoking `codex exec` directly.

Disabling Codex mode does not disable Amp's built-in modes. It only removes the delegated local Codex CLI tool from the agent's available tools.

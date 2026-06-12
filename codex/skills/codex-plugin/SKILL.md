---
name: codex-plugin
description: "Guides use of the Codex Amp plugin for bounded Codex CLI delegation. Use when the user asks to use codex, when the codex tool is available, or when a task may benefit from a separate Codex review, planning, debugging, or implementation pass."
---

# Codex Plugin

Use the Codex Amp plugin as a bounded delegation mechanism.

The plugin exposes a `codex` tool backed by local `codex exec`. Treat it as a delegated CLI agent, not as the primary Amp mode.

## Core model

Amp owns the task. Codex handles a bounded delegated pass. Amp integrates and verifies the result.

## When to use Codex

Use Codex when a separate pass would materially improve the work:

- reviewing an implementation plan
- comparing architecture or design options
- reviewing a diff for correctness
- investigating a failing test or bug hypothesis
- checking migration, data-loss, or rollback risk
- doing a higher-effort pass on a subtle issue

Do not use Codex for trivial edits, simple lookups, or work Amp can safely complete directly.

## Default posture

Prefer read-only Codex calls.

Use `workspace-write` only when:

- the user explicitly asks Codex to implement, or
- the task clearly benefits from delegated implementation, and
- Codex mode and write access are enabled.

Amp remains responsible for judging Codex output, applying or reviewing changes, running verification, and reporting the final result.

## Prompting Codex

Give Codex a bounded task, relevant file paths, constraints, and expected output.

Prefer prompts such as:

- "Review this plan for hidden coupling and missing verification."
- "Compare these implementation options and recommend the smallest safe change."
- "Investigate this failing test and suggest the likely root cause."
- "Review the current diff for correctness and unintended behaviour changes."

Avoid broad prompts such as:

- "Look at the whole repo."
- "Fix everything."
- "What do you think?"

See `reference/prompt-recipes.md` for reusable prompt shapes.

## Handling Codex output

Treat Codex output as input to the main Amp loop, not as the final answer.

After a Codex run:

1. Read the result critically.
2. Decide which findings are relevant.
3. Inspect any code before changing it.
4. Apply the smallest correct change yourself, unless the user explicitly asked Codex to write.
5. Run focused verification.
6. Report what changed, what was checked, and any remaining uncertainty.

See `reference/safety-model.md` for the plugin safety model.

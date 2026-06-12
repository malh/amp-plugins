# Prompt Recipes

Use these as starting points for bounded Codex requests. Prefer file paths and commands over pasted code when possible.

## Review a plan

```text
Use codex to review this plan. Keep it read-only.

Focus on:
- hidden coupling
- unnecessary scope
- missing verification
- simpler alternatives

Return concise findings and a recommended path.
```

## Compare implementation options

```text
Use codex to compare these implementation options. Keep it read-only.

Question:
<question>

Constraints:
- keep the public API unchanged
- avoid new dependencies
- prefer the smallest correct change

Return:
- 2 to 3 options
- tradeoffs
- recommended option
- focused verification to run afterwards
```

## Investigate a failing test

```text
Use codex to investigate this failing test. Keep it read-only.

Command:
<test command>

Observed failure:
<brief failure summary>

Find the likely root cause and suggest the smallest fix. Do not edit files.
```

## Review a diff

```text
Use codex to review the current git diff. Keep it read-only.

Focus on:
- correctness bugs
- unintended behaviour changes
- edge cases
- missing or weak verification

Ignore style-only comments unless they affect maintainability.
```

## Migration risk check

```text
Use codex to review this migration strategy. Keep it read-only.

Look for:
- data-loss risks
- rollback problems
- compatibility issues
- ordering hazards
- verification gaps

Return concrete risks and the smallest changes that reduce them.
```

## Delegated implementation

Use this only when the user explicitly wants Codex to write and plugin write access is enabled.

```text
Use codex with workspace-write to implement the narrowest fix for this issue.

Constraints:
- keep the public API unchanged
- avoid unrelated cleanup
- run focused verification if possible

Afterwards, summarise the files changed and the verification result.
```

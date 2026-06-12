# Delegation Patterns

## Plan review

Use when Amp has a candidate plan and wants an independent critique before implementation.

Good inputs:

- the plan
- relevant constraints
- files or subsystems involved
- what kind of risk to look for

Expected output:

- concise findings
- missing considerations
- recommended path

## Debugging hypothesis

Use when there is a reproducible failure, a suspicious code path, or multiple plausible causes.

Good inputs:

- failing command
- observed output
- recent changes
- relevant files or directories

Expected output:

- likely root cause
- evidence to inspect
- smallest fix to try
- verification command

## Diff review

Use after Amp has made changes and wants a correctness pass.

Good inputs:

- current git diff
- intended behaviour
- areas to ignore

Expected output:

- correctness issues
- unintended behaviour changes
- missing tests
- no style-only comments unless they matter

## Architecture option check

Use when there are several plausible designs and the decision has lasting cost.

Good inputs:

- options under consideration
- constraints
- public API or compatibility requirements
- performance or operational concerns

Expected output:

- option comparison
- tradeoffs
- recommendation
- smallest safe implementation path

// .amp/plugins/codex.ts
//
// Exposes your Codex subscription (ChatGPT auth) to Amp as one tool with a
// user-selected effort mode. Built for interactive use: codex as a second
// model inside the Amp harness.
//
//   codex                - gpt-5.5 via the Codex CLI, billed to your subscription.
//   codex: set effort    - palette command; you pick low/medium/high/xhigh.
//   codex: check         - verifies PATH and auth, shows effective settings.
//   status item          - Codex CLI effort, ChatGPT subscription eligibility,
//                          and live Codex CLI runs.
//
// Config (all optional):
//   codex.effort     - 'low' | 'medium' | 'high' | 'xhigh'     default 'high'
//   codex.allowWrite - boolean; gates sandbox=workspace-write   default false
//
// Trust model: the user picks effort and grants write access. The agent can
// request workspace-write, but it only takes effect when codex.allowWrite=true.
//
// Requires the Codex CLI (>= 0.45, Oct 2025) on PATH, authenticated via
// `codex login`, and a POSIX userland (macOS, Linux, WSL). Since 0.45, codex
// prints only the final agent message to stdout and streams progress to
// stderr, so no --output-last-message temp file is needed.
//
// Known cost: stopping a turn in Amp does not kill an in-flight codex
// process (the plugin gets no handle to it). A cancelled run completes in
// the background on your subscription.
//
// gpt-5.5-fast / gpt-5.5-pro need API-key auth; on a subscription, "fast"
// means gpt-5.5 at low effort.

import type { PluginAPI } from "@ampcode/plugin";

const MODEL = "gpt-5.5";
const EFFORTS = ["low", "medium", "high", "xhigh"] as const;
type Effort = (typeof EFFORTS)[number];
const DEFAULT_EFFORT: Effort = "high";

const EFFORT_KEY = "codex.effort";
const ALLOW_WRITE_KEY = "codex.allowWrite";

// Caps on what flows back into the calling thread's context window.
const MAX_RESULT_CHARS = 50_000;
const MAX_ERROR_CHARS = 4_000;

function parseEffort(value: unknown): Effort {
  return typeof value === "string" &&
    (EFFORTS as readonly string[]).includes(value)
    ? (value as Effort)
    : DEFAULT_EFFORT;
}

// Keep the head (the substance) and the tail (the conclusion); mark the cut.
function clamp(text: string, max: number): string {
  if (text.length <= max) return text;
  const head = text.slice(0, Math.floor(max * 0.9));
  const tail = text.slice(text.length - Math.floor(max * 0.1));
  return `${head}\n\n[... ${text.length - max} chars truncated ...]\n\n${tail}`;
}

// Errors accumulate at the end of a stream; keep the tail.
function clampTail(text: string, max: number): string {
  if (text.length <= max) return text;
  return `[... ${text.length - max} chars truncated ...]\n${text.slice(text.length - max)}`;
}

export default function (amp: PluginAPI) {
  amp.logger.log("[codex] plugin initialized");

  async function settings() {
    const config = await amp.configuration.get();
    return {
      effort: parseEffort(config[EFFORT_KEY]),
      allowWrite: config[ALLOW_WRITE_KEY] === true,
    };
  }

  // Status item: current effort plus live run count, click to change effort.
  // The generation counter stops a slow refresh from overwriting a newer one.
  const status = amp.experimental?.createStatusItem();
  let inFlight = 0;
  let statusGen = 0;

  async function isSubscriptionEligibleThreadActive() {
    const activeThread = amp.experimental?.activeThread.current;
    if (!activeThread || !amp.experimental?.threads) return false;

    try {
      const agent = await amp.experimental.threads.get(activeThread.id).agent();
      const definition = agent.definition;
      if (
        definition.kind === "builtin-agent" &&
        (definition.mode === "deep" || definition.mode === "rush")
      ) {
        return true;
      }
    } catch (error) {
      amp.logger.log("[codex] failed to inspect active thread agent", error);
    }

    return false;
  }

  async function refreshStatus() {
    const gen = ++statusGen;
    const [{ effort }, isSubscriptionActive] = await Promise.all([
      settings(),
      isSubscriptionEligibleThreadActive(),
    ]);
    if (gen !== statusGen) return;
    const base = `Codex ${effort} • GPT ${isSubscriptionActive ? "🟢" : "⚪"}`;
    status?.update({
      text:
        inFlight === 0
          ? base
          : inFlight === 1
            ? `${base} (running)`
            : `${base} (${inFlight} running)`,
      url: "command:set-codex-effort",
    });
  }
  void refreshStatus();
  amp.configuration.subscribe(() => void refreshStatus());
  amp.experimental?.activeThread.subscribe(() => void refreshStatus());

  amp.on("session.start", () => {
    void refreshStatus();
  });

  amp.registerCommand(
    "set-codex-effort",
    {
      title: "Set Codex effort",
      category: "codex",
      description: `Pick the ${MODEL} reasoning effort used by the codex tool (persists in config as ${EFFORT_KEY}).`,
    },
    async (ctx) => {
      const { effort: active } = await settings();
      const choice = await ctx.ui.select({
        title: "Codex reasoning effort",
        message:
          "low = seconds, quick checks. medium = routine work. high = thorough. xhigh = max reasoning, slow.",
        initialValue: active,
        options: [...EFFORTS],
      });
      if (!choice || choice === active) return;
      await amp.configuration.update({ [EFFORT_KEY]: choice }, "global");
      await ctx.ui.notify(`Codex effort set to ${choice}.`);
    },
  );

  amp.registerTool({
    name: "codex",
    description:
      `Consult OpenAI ${MODEL} via the Codex CLI (billed to the user's Codex subscription). ` +
      "Reasoning effort is set by the user; do not attempt to choose it. " +
      "Read-only by default: it analyses, you implement. workspace-write is honoured only if the user has set codex.allowWrite=true.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description:
            "The task or question for Codex. Reference files by path (e.g. @src/main.ts) rather than pasting contents - Codex reads them itself.",
        },
        sandbox: {
          type: "string",
          enum: ["read-only", "workspace-write"],
          description:
            "Filesystem access. Default read-only (analysis/consultation). workspace-write requires the user to opt in via codex.allowWrite.",
        },
        cwd: {
          type: "string",
          description:
            "Working directory for the Codex run. Defaults to the current directory.",
        },
      },
      required: ["prompt"],
    },
    async execute(input, ctx) {
      const prompt =
        typeof input.prompt === "string" ? input.prompt.trim() : "";
      if (!prompt) return "Error: prompt was empty.";

      const { effort, allowWrite } = await settings();

      const wantsWrite = input.sandbox === "workspace-write";
      if (wantsWrite && !allowWrite) {
        return (
          "Error: workspace-write was requested but the user has not enabled it " +
          `(${ALLOW_WRITE_KEY} is not true). Run read-only and implement the changes yourself, ` +
          "or ask the user to enable it."
        );
      }
      const sandbox = wantsWrite ? "workspace-write" : "read-only";
      const cwd =
        typeof input.cwd === "string" && input.cwd.trim()
          ? input.cwd.trim()
          : process.cwd();

      ctx.logger.log(
        `[codex] effort=${effort} sandbox=${sandbox} cwd=${cwd} :: ${prompt.slice(0, 120)}`,
      );

      inFlight++;
      void refreshStatus();
      try {
        // Prompt over stdin ('-'): immune to ARG_MAX, invisible to `ps`.
        // printf '%s' is flag-proof where echo is not.
        const result = await amp.$`printf '%s' ${prompt} | codex exec \
					--skip-git-repo-check \
					--cd ${cwd} \
					-s ${sandbox} \
					-m ${MODEL} \
					-c model_reasoning_effort=${effort} \
					-`;

        if (result.exitCode !== 0) {
          return [
            `Error: codex exec failed (exit ${result.exitCode}).`,
            clampTail(
              result.stderr.trim() || result.stdout.trim(),
              MAX_ERROR_CHARS,
            ),
            "Check `codex login status` and that the codex CLI is on PATH (palette: codex: check).",
          ]
            .filter(Boolean)
            .join("\n\n");
        }

        const message = result.stdout.trim();
        return (
          `[codex ${MODEL} effort=${effort} sandbox=${sandbox}]\n\n` +
          clamp(message || "(codex returned no output)", MAX_RESULT_CHARS)
        );
      } finally {
        inFlight--;
        void refreshStatus();
      }
    },
  });

  amp.registerCommand(
    "codex-check",
    {
      title: "Check Codex CLI auth and settings",
      category: "codex",
      description: `Verify codex is on PATH and logged in; show effective ${MODEL} settings.`,
    },
    async (ctx) => {
      const [version, login, { effort, allowWrite }] = await Promise.all([
        amp.$`codex --version`,
        amp.$`codex login status`,
        settings(),
      ]);
      await ctx.ui.notify(
        [
          `codex: ${version.exitCode === 0 ? version.stdout.trim() : "NOT FOUND on PATH"}`,
          `auth: ${login.exitCode === 0 ? login.stdout.trim() : login.stderr.trim() || login.stdout.trim() || "unknown"}`,
          `effort: ${effort} (palette: codex: set codex effort)`,
          `write: ${allowWrite ? `enabled via ${ALLOW_WRITE_KEY}` : `read-only (set ${ALLOW_WRITE_KEY}=true to allow)`}`,
        ].join("\n"),
      );
    },
  );
}

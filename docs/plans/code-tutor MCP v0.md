Got it. Here’s a tight, build-ready v0.1 (“generic explain only”) plan you can drop into Claude Code today. No repo context, no indexer—just fast “what is this?” explanations with formatting, length presets, and shortcuts.

v0.1 Scope (what’s in / out)

In
	•	Explain the selected code generically (language/framework concept), no repo awareness.
	•	Length presets with distinct hotkeys (micro / short / paragraph / deep).
	•	Clean Markdown output in Claude Code chat, with a clear header separator.
	•	Basic text formatting controls (headings/bullets/code blocks; optional ASCII/emoji headers).
	•	Redaction of secrets from snippets.
	•	Configurable token caps per length.

Out
	•	Repo context (“where used”, call graphs), sidecar indexer, panes/splits, diagrams, budgets per day (we’ll still have per-call caps).

⸻

User flow
	1.	In Claude Code, select code (or paste a snippet).
	2.	Trigger a length-specific shortcut (e.g., ⌘⇧1/⌘⇧2/⌘⇧3/⌘⇧4).
	3.	MCP returns a Markdown card as a normal chat message immediately below your current exchange, prefixed with a separator line.

Separator example:

── TeachBlade: Explain • generic • short

⸻

Length presets & hotkeys (suggested)
	•	Micro — 1–3 lines. Hotkey: ⌘⇧1 / Ctrl+Shift+1
	•	Short — 4–6 bullets (~80–120 words). Hotkey: ⌘⇧2 / Ctrl+Shift+2
	•	Paragraph — single tight paragraph (120–180 words), ≤10-line example. Hotkey: ⌘⇧3 / Ctrl+Shift+3
	•	Deep — expanded (250–350 words), ≤12-line example, pitfalls. Hotkey: ⌘⇧4 / Ctrl+Shift+4

If you don’t bind keys yet, you can pick the tool from Claude Code’s tool list, or type “Explain (short)”—the MCP will expose aliases for convenience.

⸻

MCP surface (v0.1)

Expose one core tool + four thin aliases so you can bind each to a different length without parameters.

1) Core tool

explain_symbol_generic
	•	input

{
  "source": { "file": "path/to/file.py", "selection": { "start": { "line": 12, "col": 0 }, "end": { "line": 25, "col": 99 } } },
  "language": "auto|py|ts|js|go|rs|rb",
  "length": "micro|short|paragraph|deep",
  "format": "markdown",
  "max_tokens_out": 600
}

	•	Accepts source.snippet instead of file/selection when you paste code directly.
	•	Internally trims to ≤60 lines around selection; attempts a light construct classification (best-effort).
	•	output (Markdown string) with a header line, then sections per length template.

2) Length aliases (thin wrappers)
	•	explain_micro → calls core with length:"micro"
	•	explain_short → length:"short"
	•	explain_paragraph → length:"paragraph"
	•	explain_deep → length:"deep"

3) Preferences

set_preferences

{
  "ui": {
    "separator": "ascii|emoji|none",
    "header_emoji": "💡",
    "show_language_line": true
  },
  "output": {
    "default_length": "short",
    "max_tokens_micro": 150,
    "max_tokens_short": 250,
    "max_tokens_paragraph": 450,
    "max_tokens_deep": 700
  },
  "redaction": {
    "enable": true,
    "patterns": ["(?i)api[_-]?key\\s*[:=].+", "AKIA[0-9A-Z]{16}", "-----BEGIN [A-Z ]+ PRIVATE KEY-----"]
  }
}


⸻

Prompt contracts (strict, length-aware)

Shared system preface (applies to all lengths)

You are a concise language tutor. Explain the selected code construct conceptually for the given language. Do not reference repository files or project structure. Prefer bullet points over prose unless the length mode says “paragraph”. Keep within the output budget.

Micro (1–3 lines)

Output exactly 1–3 bullet lines:
	1.	What it is, 2) When to use, 3) One pitfall or tip. No code blocks.

Short (4–6 bullets)

Output 4–6 bullet points: Concept • When to use • Inputs/Outputs or signature • 1 common pitfall • 1 tip. No code blocks.

Paragraph (120–180 words)

Output one paragraph (120–180 words). Include a ≤10-line code example in a fenced block after the paragraph.

Deep (250–350 words)

Output 2 short paragraphs (overview, nuances/pitfalls) and a ≤12-line code example. End with a “Checklist” of 3 bullets.

The MCP sets max_tokens_out to enforce each mode’s upper bound.

⸻

Output shape (Markdown)

Example header + body:

── TeachBlade: Explain • generic • short
**Language:** Python • **Construct (best-guess):** decorator

- Adds behavior to a function/class by wrapping it.
- Use when cross-cutting concerns (logging, caching, auth) shouldn’t clutter core logic.
- Signature: `@decorator_name` above a def/class; receives and returns callables.
- Pitfall: decorators that keep state must preserve function metadata; use `functools.wraps`.
- Tip: prefer small, focused decorators; compose rather than branch on behavior.

── TeachBlade: Explain • generic • short
**Language:** Python • **Construct (best-guess):** decorator

- Adds behavior to a function/class by wrapping it.
- Use when cross-cutting concerns (logging, caching, auth) shouldn’t clutter core logic.
- Signature: `@decorator_name` above a def/class; receives and returns callables.
- Pitfall: decorators that keep state must preserve function metadata; use `functools.wraps`.
- Tip: prefer small, focused decorators; compose rather than branch on behavior.

Header rendering choices
	•	separator: "ascii" → ── TeachBlade: …
	•	separator: "emoji" → 💡 TeachBlade: …
	•	separator: "none" → just the card

⸻

Lightweight construct classification (best-effort)
	•	language detection: language param or file extension fallback.
	•	regex hints (v0.1 only; no LSP):
	•	py: ^def , ^class , @, async def, with, yield
	•	ts/js: class , function , =>, import , export , useEffect\(
	•	If uncertain, label: Construct: unknown (best-guess: expression) and keep explanation generic.

⸻

Redaction (default ON)

Before sending to the model:
	•	Drop lines matching keys/tokens/PEM blocks.
	•	Truncate gigantic literals.
	•	If any redaction occurred, add a small footer: _Some content was redacted for safety._

⸻

Config file (optional)

.teachblade.json at repo root or user home:

{
  "ui": { "separator": "ascii", "header_emoji": "💡", "show_language_line": true },
  "output": { "default_length": "short", "max_tokens_short": 250 },
  "redaction": { "enable": true }
}


⸻

Keybindings (two ways)

A) Inside Claude Code (recommended)
	•	Bind each alias tool to a shortcut:
	•	⌘⇧1 → explain_micro
	•	⌘⇧2 → explain_short
	•	⌘⇧3 → explain_paragraph
	•	⌘⇧4 → explain_deep

B) Terminal clipboard (optional)
	•	iTerm Keys → add shortcut → “Send text”: teach explain --from-clipboard --length short\n
(CLI simply forwards to explain_symbol_generic(snippet=pbpaste).)

⸻

Minimal implementation checklist

Day 0 — Scaffold
	•	Node/TS MCP server (stdio).
	•	Tool registry with 5 tools: core explain + 4 aliases + set_preferences.
	•	File/selection reader; snippet trimmer (≤60 lines).

Day 1 — Core features
	•	Redaction pass.
	•	Regex-based construct classifier.
	•	Prompt templates for 4 lengths.
	•	Markdown renderer with header/separator options.
	•	Token cap mapping per length.

Day 2 — Fit & polish
	•	Config loader/merger (env → user file → workspace file).
	•	Friendly error messages (no selection/snippet too big/unknown language).
	•	Unit tests: redaction, trimming, length conformance (e.g., micro: ≤3 bullets).
	•	Smoke tests on small Python/TS repos.

⸻

Defaults (sane starting values)
	•	default_length: short
	•	Token caps: micro 150, short 250, paragraph 450, deep 700
	•	Max snippet window: 60 lines, centered on selection
	•	Separator: ascii, header emoji: 💡
	•	Redaction: enabled

⸻

Risks & guardrails
	•	Wrong construct guess → label “best-guess”; explanation stays generic; fine for v0.1.
	•	Over-long answers → enforce caps and validate structure (bullets vs paragraph) before returning.
	•	Secrets in snippets → redaction on by default; keep patterns expand-able.
	•	Hotkey availability → aliases mean you can bind per-length even if a UI can’t pass params.

⸻

Working name

TeachBlade (MCP) — we can rebrand later; no dependency on “Claude”.

⸻

If you want, I’ll turn this into:
	•	the exact TypeScript handler signatures,
	•	a sample mcpServers JSON block,
	•	and the four prompt strings ready to paste.






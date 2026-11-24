// One-Line Office Joke — entry 2 for the 24-Hour Sprint (pass 2).
// The program keeps a single joke line, proves it against the local
// copy of the competition gate, writes it to /output/entry.txt, reads
// the file back and only then prints one status line with the bytes,
// the sha256, the character and word counts and the gate verdict.
//
// The joke: the team offsite is one floor down in the same building,
// and the organisers still hired a coach bus to get us there. The
// setup is a ritual every office worker knows (the offsite); the
// payoff is the logistics (a coach for a single floor). One sentence,
// no borrowed punchline, nothing to explain on a second read.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

// ---------------------------------------------------------------------------
// The joke line
// ---------------------------------------------------------------------------

const JOKE_LINE =
  "Our team offsite is one floor down in the same building, and they still hired a coach bus to get us there.";

// Distinct office terms; at least two must appear so the line is rooted
// in office life rather than a generic one-liner.
const OFFICE_TERMS = [
  "team",
  "offsite",
  "floor",
  "building",
  "coach bus",
  "meeting",
  "office",
  "manager",
  "standup",
  "deadline",
  "inbox",
  "calendar",
  "printer",
  "lift",
  "hr",
  "facilities",
  "away day",
];

// Sentence closers the gate accepts.
const TERMINAL_MARKS = [".", "!", "?"];

// Gate limits, straight from the competition rules.
const MIN_CHARS = 1;
const MAX_CHARS = 200;
const MIN_WORDS = 8;
const MAX_WORDS = 40;
const MIN_OFFICE_TERMS = 2;

// ---------------------------------------------------------------------------
// Check results: every rule reports a named verdict, never a bare boolean
// ---------------------------------------------------------------------------

type Verdict = {
  readonly rule: string;
  readonly passed: boolean;
  readonly note: string;
};

function verdictOk(rule: string, note: string): Verdict {
  return { rule, passed: true, note };
}

function verdictBad(rule: string, note: string): Verdict {
  return { rule, passed: false, note };
}

// ---------------------------------------------------------------------------
// The rules, one small function each
// ---------------------------------------------------------------------------

function ruleNonBlank(line: string): Verdict {
  if (line.trim().length === 0) {
    return verdictBad("non-blank", "line is blank");
  }
  return verdictOk("non-blank", "has visible text");
}

function ruleLength(line: string): Verdict {
  const count = [...line].length;
  if (count < MIN_CHARS) {
    return verdictBad("length", `too short: ${count} chars`);
  }
  if (count > MAX_CHARS) {
    return verdictBad("length", `too long: ${count} chars`);
  }
  return verdictOk("length", `${count} chars within ${MIN_CHARS}-${MAX_CHARS}`);
}

function ruleSingleLine(line: string): Verdict {
  if (line.includes("\n") || line.includes("\r")) {
    return verdictBad("single-line", "contains a line break");
  }
  return verdictOk("single-line", "no line break");
}

function ruleNoControlGlyphs(line: string): Verdict {
  for (const glyph of line) {
    const code = glyph.codePointAt(0);
    if (code !== undefined && code < 32) {
      return verdictBad("no-control", `control glyph U+${code.toString(16)}`);
    }
  }
  return verdictOk("no-control", "no control glyphs");
}

function ruleTightSpacing(line: string): Verdict {
  if (line.includes("  ")) {
    return verdictBad("spacing", "double space found");
  }
  if (line.startsWith(" ") || line.endsWith(" ")) {
    return verdictBad("spacing", "leading or trailing space");
  }
  return verdictOk("spacing", "spacing tight");
}

function ruleSentenceCloser(line: string): Verdict {
  const lastGlyph = line[line.length - 1];
  if (lastGlyph === undefined) {
    return verdictBad("closer", "empty line has no ending mark");
  }
  if (!TERMINAL_MARKS.includes(lastGlyph)) {
    return verdictBad("closer", `ends with '${lastGlyph}'`);
  }
  return verdictOk("closer", `ends with '${lastGlyph}'`);
}

function ruleWordCount(line: string): Verdict {
  const words = line.split(/\s+/).filter((w) => w.length > 0);
  if (words.length < MIN_WORDS) {
    return verdictBad("word-count", `only ${words.length} words`);
  }
  if (words.length > MAX_WORDS) {
    return verdictBad("word-count", `${words.length} words, over the cap`);
  }
  return verdictOk("word-count", `${words.length} words within ${MIN_WORDS}-${MAX_WORDS}`);
}

function ruleOfficeTerms(line: string): Verdict {
  const lowered = line.toLowerCase();
  const hits = OFFICE_TERMS.filter((term) => lowered.includes(term));
  if (hits.length < MIN_OFFICE_TERMS) {
    return verdictBad("office-terms", `only ${hits.length} term(s): ${hits.join(", ")}`);
  }
  return verdictOk("office-terms", `terms: ${hits.join(", ")}`);
}

function ruleOneSentence(line: string): Verdict {
  const marks = [...line].filter((g) => TERMINAL_MARKS.includes(g));
  if (marks.length !== 1) {
    return verdictBad("one-sentence", `${marks.length} sentence marks, want exactly 1`);
  }
  return verdictOk("one-sentence", "exactly one sentence");
}

function ruleNoLinksOrHandles(line: string): Verdict {
  if (line.includes("http") || line.includes("www.") || line.includes("@")) {
    return verdictBad("no-links", "contains a link or handle");
  }
  return verdictOk("no-links", "plain text only");
}

// ---------------------------------------------------------------------------
// Gate runner: fixed order, first failure wins and names its rule
// ---------------------------------------------------------------------------

const GATE_RULES: ReadonlyArray<(line: string) => Verdict> = [
  ruleNonBlank,
  ruleLength,
  ruleSingleLine,
  ruleNoControlGlyphs,
  ruleTightSpacing,
  ruleSentenceCloser,
  ruleWordCount,
  ruleOfficeTerms,
  ruleOneSentence,
  ruleNoLinksOrHandles,
];

function runGate(line: string): Verdict {
  for (const ruleFn of GATE_RULES) {
    const found = ruleFn(line);
    if (!found.passed) {
      return found;
    }
  }
  return verdictOk("gate", "all gate rules passed");
}

// ---------------------------------------------------------------------------
// Output: resolve path, write, read back, compare bytes
// ---------------------------------------------------------------------------

function resolveOutputPath(): string {
  const override = process.env.JOKE_OUTPUT_PATH;
  if (override !== undefined && override.trim().length > 0) {
    return override.trim();
  }
  return "/output/entry.txt";
}

function digestHex(payload: Buffer): string {
  return createHash("sha256").update(payload).digest("hex");
}

function writeAndVerify(line: string, targetPath: string): Buffer {
  const payload = Buffer.from(`${line}\n`, "utf8");
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, payload);
  const reread = readFileSync(targetPath);
  if (!reread.equals(payload)) {
    throw new Error("reread bytes differ from written bytes");
  }
  return payload;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function main(): void {
  const gate = runGate(JOKE_LINE);
  if (!gate.passed) {
    throw new Error(`gate failed at ${gate.rule}: ${gate.note}`);
  }
  const targetPath = resolveOutputPath();
  const payload = writeAndVerify(JOKE_LINE, targetPath);
  const charCount = [...JOKE_LINE].length;
  const wordCount = JOKE_LINE.split(/\s+/).filter((w) => w.length > 0).length;
  const digest = digestHex(payload);
  console.log(
    `OK bytes=${payload.length} sha256=${digest} chars=${charCount} words=${wordCount} gate=${gate.note} path=${targetPath}`,
  );
}

main();

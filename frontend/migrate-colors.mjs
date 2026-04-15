#!/usr/bin/env node
/**
 * migrate-colors.mjs
 *
 * Replaces repeated dark/light Tailwind class pairs with single semantic tokens.
 * Run:  node migrate-colors.mjs            (dry-run, shows diffs)
 *       node migrate-colors.mjs --apply    (writes files)
 */

import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const DRY_RUN = !process.argv.includes("--apply");

// ── Replacement map ────────────────────────────────────────────────
// Each entry: [regex-matching the old pair, replacement string]
// Order matters — longer / more specific patterns first to avoid partial matches.

const replacements = [
  // ── Text ──────────────────────────────────────────
  // heading: text-navy dark:text-cream
  [/text-navy\s+dark:text-cream(?![\/\w-])/g, "text-heading"],

  // sub: text-navy/70 dark:text-cream/60
  [/text-navy\/70\s+dark:text-cream\/60/g, "text-sub"],

  // muted: text-navy/50 dark:text-cream/40
  [/text-navy\/50\s+dark:text-cream\/40/g, "text-muted"],

  // faint: text-navy/40 dark:text-cream/35
  [/text-navy\/40\s+dark:text-cream\/35/g, "text-faint"],

  // on-primary (button text): text-cream-50 dark:text-navy
  [/text-cream-50\s+dark:text-navy(?![\/\w-])/g, "text-on-primary"],

  // on-secondary (secondary button text): text-navy/70 dark:text-cream/60
  // (already covered by text-sub above — same values)

  // ── Icon muted ────────────────────────────────────
  // text-navy/40 dark:text-cream/40
  [/text-navy\/40\s+dark:text-cream\/40/g, "text-icon-muted"],

  // ── Placeholder ───────────────────────────────────
  // placeholder:text-navy/35 dark:placeholder:text-cream/25
  [/placeholder:text-navy\/35\s+dark:placeholder:text-cream\/25/g, "placeholder:text-placeholder"],

  // ── Backgrounds ───────────────────────────────────
  // surface: bg-cream-50 dark:bg-navy-700/50  (exact)
  [/bg-cream-50\s+dark:bg-navy-700\/50(?!\d)/g, "bg-surface-alt"],

  // surface with opacity: bg-cream-50\/80 dark:bg-navy-700\/30
  [/bg-cream-50\/80\s+dark:bg-navy-700\/30/g, "bg-surface"],

  // surface-hover: bg-cream-300/40 dark:bg-navy-700/40
  [/bg-cream-300\/40\s+dark:bg-navy-700\/40/g, "bg-surface-hover"],

  // hover:bg surface-hover
  [/hover:bg-cream-300\/40\s+dark:hover:bg-navy-700\/40/g, "hover:bg-surface-hover"],
  [/hover:bg-cream-300\/60\s+dark:hover:bg-navy-700\/60/g, "hover:bg-surface-hover"],

  // btn-primary: bg-navy dark:bg-cream
  [/bg-navy\s+dark:bg-cream(?![\/\w-])/g, "bg-btn-primary"],

  // btn-primary-hover: hover:bg-navy/90 dark:hover:bg-cream/90
  [/hover:bg-navy\/90\s+dark:hover:bg-cream\/90/g, "hover:bg-btn-primary-hover"],

  // ── Borders ───────────────────────────────────────
  // border-default: border-cream-300/40 dark:border-navy-700/40
  [/border-cream-300\/40\s+dark:border-navy-700\/40/g, "border-border-default"],

  // border-subtle: border-cream-300/30 dark:border-navy-700/30
  [/border-cream-300\/30\s+dark:border-navy-700\/30/g, "border-border-subtle"],

  // ── Shadows ───────────────────────────────────────
  // shadow-navy/15 dark:shadow-cream/10
  [/shadow-navy\/15\s+dark:shadow-cream\/10/g, "shadow-navy/15 dark:shadow-cream/10"],
  // (shadows don't benefit much from tokens — skip)
];

// ── Find all .tsx files ─────────────────────────────────────────────
const files = execSync('find src -name "*.tsx" -type f', { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter(Boolean);

let totalReplacements = 0;
let filesModified = 0;

for (const file of files) {
  const original = readFileSync(file, "utf8");
  let content = original;

  let fileCount = 0;
  for (const [pattern, replacement] of replacements) {
    const before = content;
    content = content.replace(pattern, replacement);
    // Count how many replacements happened
    const matches = before.match(pattern);
    if (matches) fileCount += matches.length;
  }

  if (content !== original) {
    filesModified++;
    totalReplacements += fileCount;

    if (DRY_RUN) {
      console.log(`\n📄 ${file} (${fileCount} replacements)`);
    } else {
      writeFileSync(file, content, "utf8");
      console.log(`✅ ${file} (${fileCount} replacements)`);
    }
  }
}

console.log("\n" + "─".repeat(50));
console.log(`${DRY_RUN ? "DRY RUN — " : ""}${totalReplacements} replacements across ${filesModified} files`);
if (DRY_RUN) {
  console.log(`\nRun with --apply to write changes:\n  node migrate-colors.mjs --apply`);
}

#!/usr/bin/env node
/**
 * タスク追加コマンド
 * 使い方: node add-task.mjs "タスク名" "YYYY-MM-DD"
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

// ─── 定数 ──────────────────────────────────────────────────────────────────

const TASKS_FILE = resolve(process.cwd(), "tasks.md");
const SECTION_HEADER = "## タスク一覧";

// ─── ヘルパー ───────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function isValidDate(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str);
  return !isNaN(d.getTime()) && d.toISOString().startsWith(str);
}

function formatEntry(name, deadline) {
  return `- [ ] ${name} (期限: ${deadline}) [登録: ${todayStr()}]`;
}

// ─── バリデーション ─────────────────────────────────────────────────────────

const [taskName, deadline] = process.argv.slice(2);

if (!taskName || !deadline) {
  console.error("エラー: 引数が不足しています。");
  console.error('使い方: node add-task.mjs "タスク名" "YYYY-MM-DD"');
  console.error(`例:     node add-task.mjs "ダッシュボード改修" "${todayStr()}"`);
  process.exit(1);
}

if (!isValidDate(deadline)) {
  console.error(`エラー: 期限の形式が正しくありません → "${deadline}"`);
  console.error(`正しい形式: YYYY-MM-DD（例: ${todayStr()}）`);
  process.exit(1);
}

if (new Date(deadline) < new Date(todayStr())) {
  console.warn(`警告: 期限 ${deadline} は過去の日付です。`);
}

// ─── ファイル書き込み ───────────────────────────────────────────────────────

const entry = formatEntry(taskName, deadline);

if (!existsSync(TASKS_FILE)) {
  // 新規作成
  const initial = [
    "# タスク管理",
    "",
    SECTION_HEADER,
    "",
    entry,
    "",
  ].join("\n");
  writeFileSync(TASKS_FILE, initial, "utf-8");
  console.log(`✓ tasks.md を新規作成してタスクを追加しました。`);
} else {
  const content = readFileSync(TASKS_FILE, "utf-8");

  let updated;
  if (content.includes(SECTION_HEADER)) {
    // セクションが存在する → セクション末尾（次の ## の手前 or ファイル末尾）に追加
    const sectionIdx = content.indexOf(SECTION_HEADER);
    const nextSectionIdx = content.indexOf("\n## ", sectionIdx + 1);
    if (nextSectionIdx === -1) {
      updated = content.trimEnd() + "\n" + entry + "\n";
    } else {
      updated =
        content.slice(0, nextSectionIdx).trimEnd() +
        "\n" +
        entry +
        "\n" +
        content.slice(nextSectionIdx);
    }
  } else {
    // セクションがない → ファイル末尾に追加
    updated =
      content.trimEnd() + "\n\n" + SECTION_HEADER + "\n\n" + entry + "\n";
  }

  writeFileSync(TASKS_FILE, updated, "utf-8");
  console.log(`✓ タスクを追加しました。`);
}

console.log(`  ${entry}`);
console.log(`  ファイル: ${TASKS_FILE}`);

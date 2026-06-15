import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const indexPath = path.join(root, 'index.html');
const statsPath = path.join(root, 'scripts', 'update-public-stats.mjs');
const index = fs.readFileSync(indexPath, 'utf8');
const stats = fs.readFileSync(statsPath, 'utf8');

function extractFunction(source, functionName) {
  const marker = `function ${functionName}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `找不到函式：${functionName}`);
  const bodyStart = source.indexOf('{', start);
  assert.notEqual(bodyStart, -1, `找不到函式起始大括號：${functionName}`);
  let depth = 0;
  let quote = '';
  let escaped = false;
  let templateExpressionDepth = 0;
  for (let i = bodyStart; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote) {
      if (ch === '\\') {
        escaped = true;
      } else if (quote === '`' && ch === '$' && next === '{') {
        templateExpressionDepth += 1;
        i += 1;
      } else if (quote === '`' && ch === '}' && templateExpressionDepth > 0) {
        templateExpressionDepth -= 1;
      } else if (ch === quote && templateExpressionDepth === 0) {
        quote = '';
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '/' && next === '/') {
      const end = source.indexOf('\n', i + 2);
      i = end === -1 ? source.length : end;
      continue;
    }
    if (ch === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      assert.notEqual(end, -1, `未結束註解：${functionName}`);
      i = end + 1;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`未找到函式結尾：${functionName}`);
}

function assertIncludes(haystack, needle, label) {
  assert.ok(haystack.includes(needle), label);
}

// 版本與分享資訊
assertIncludes(index, 'const GAME_VERSION = "V2.4.5";', 'GAME_VERSION 必須為 V2.4.5');
assertIncludes(index, '<meta property="og:title" content="極限操控方塊 V2.4.5', 'Open Graph 標題未更新');
assertIncludes(index, '<meta name="application-version" content="V2.4.5">', 'application-version 未更新');
assert.ok(!stats.includes("gameVersion: 'V2.4.3'"), '統計腳本仍存在 V2.4.3 寫入');
assert.equal((stats.match(/gameVersion: 'V2\.4\.5'/g) || []).length, 2, '統計腳本應有兩處 V2.4.5 固定版本');

// 高等級續玩與消行一致性
assert.ok(!index.includes('if (best >= 20) return 21;'), '仍存在 Level 20 以上固定退回 Level 21');
const hardStart = extractFunction(index, 'hardApplyStateOrFresh');
assertIncludes(hardStart, 'score = continuation ? continuation.score : 0;', '續玩未從完整快照恢復分數');
assertIncludes(hardStart, 'lines = continuation ? continuation.lines : 0;', '續玩未從完整快照恢復消行');
assertIncludes(hardStart, 'level = Math.max(1, Math.min(LEVELS.length, startLevel));', '續玩未恢復快照關卡');

// Game Over 黑屏保護
const showOverlay = extractFunction(index, 'showOverlay');
assertIncludes(showOverlay, "overlayEl.style.visibility = 'visible'", 'showOverlay 未恢復 visibility');
const endGame = extractFunction(index, 'endGame');
assert.ok(endGame.indexOf('showOverlay();') < endGame.indexOf("safeRun('submitScoreToCloud'"), 'Game Over 必須先顯示罩幕，再結算排行榜');
assertIncludes(endGame, "safeRun('submitScoreToCloud'", 'Game Over 排行榜流程未做例外隔離');

// 二次確認與手機視窗
assertIncludes(index, 'id="game-action-confirm-modal" class="hidden fixed inset-0', '二次確認視窗必須固定覆蓋畫面');
assertIncludes(index, 'max-h-[92dvh]', '二次確認視窗缺少手機高度限制');
assertIncludes(index, 'async function confirmReturnHomeFromCurrentOverlay()', '返回首頁缺少二次確認');
assertIncludes(index, 'async function confirmReturnHomeAfterGameOver()', 'Game Over 休息回首頁缺少二次確認');
assertIncludes(index, 'async function confirmRestartCurrentGameplay()', '鍵盤 R 缺少二次確認');
const retryScore = extractFunction(index, 'retryCurrentLevelWithScorePenalty');
assert.ok(!/\bconfirm\s*\(/.test(retryScore), '扣分重挑仍會出現第三次原生 confirm');

// 完整成績快照演算法：選到哪一筆，就整筆保留，不能把 192 行拼到另一筆高分。
const snapshotStart = index.indexOf('function normalizePerformanceSnapshot');
const snapshotEnd = index.indexOf('function loadPlayers', snapshotStart);
assert.ok(snapshotStart >= 0 && snapshotEnd > snapshotStart, '無法擷取完整快照函式群組');
const snapshotCode = [
  index.slice(snapshotStart, snapshotEnd),
  'globalThis.__snapshotApi = { normalizePerformanceSnapshot, comparePerformanceSnapshots, selectBestPerformanceSnapshot };'
].join('\n');
const context = vm.createContext({ Date, Math, Number, String, Array, Object });
vm.runInContext(snapshotCode, context);
const { normalizePerformanceSnapshot, selectBestPerformanceSnapshot } = context.__snapshotApi;
const oldRecord = normalizePerformanceSnapshot({ score: 2175042, level: 32, lines: 192, at: 1 });
const laterRecord = normalizePerformanceSnapshot({ score: 2306634, level: 32, lines: 14, at: 2 });
const selected = selectBestPerformanceSnapshot([oldRecord, laterRecord]);
assert.equal(selected.score, 2306634, '最高分比較錯誤');
assert.equal(selected.level, 32, '所選完整快照關卡錯誤');
assert.equal(selected.lines, 14, '演算法不可把另一筆紀錄的 192 行拼入最高分紀錄');

// HTML 內 ES module 語法檢查
const moduleMatches = [...index.matchAll(/<script\s+type="module"[^>]*>([\s\S]*?)<\/script>/gi)];
assert.ok(moduleMatches.length >= 1, '找不到 ES module script');
const moduleSource = moduleMatches.map(match => match[1]).join('\n');
const tempModule = path.join(os.tmpdir(), `abrakai-v245-${process.pid}.mjs`);
fs.writeFileSync(tempModule, moduleSource);
const syntax = spawnSync(process.execPath, ['--check', tempModule], { encoding: 'utf8' });
fs.rmSync(tempModule, { force: true });
assert.equal(syntax.status, 0, `index.html ES module 語法錯誤：\n${syntax.stderr}`);


assert(!index.includes('開始全新挑戰'), 'Game Over 不應再提供從 LEVEL 1 開始的全新挑戰');
assert(index.includes('休息回首頁，下次再挑戰'), 'Game Over 應提供休息回首頁選項');
assert(index.includes('data-retry-action="home"'), '重挑面板應提供回首頁動作');
assert(index.includes('preserveRetryCheckpointAsOfficialSave'), 'Game Over 應將最近 checkpoint 保存為正式存檔');
assert(index.includes("preserve retry checkpoint after game over"), 'Game Over 不應直接清除正式存檔');
assert(index.includes('快捷鍵 R 不會建立 LEVEL 1 新局'), '鍵盤 R 不得建立 LEVEL 1 新局');
console.log('V2.4.5 靜態驗證通過：版本、完整快照、續玩、Game Over、二次確認與 JS 語法。');

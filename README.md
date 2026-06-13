# 極限操控方塊 V2.2.3｜全球統計讀取啟動修正版

## 修正重點
- 修正 GitHub Actions 已成功、Firestore 已寫入，但首頁仍停留在「等待」與破折號的問題。
- 根因：`initializeGlobalStats()` 被放在一般 `<script>` 中，無法存取 ES Module 內的 Firebase 函式，因此初始化根本沒有啟動。
- 已將 Firebase 初始化與「讀取最新彙整」按鈕事件移回同一個 ES Module 作用域。
- 公開統計會在首頁載入時自動讀取 `public_stats/summary`。
- 手動按鈕改名為「讀取最新彙整」。
- GitHub Actions 更新為 Node.js 24、`actions/checkout@v5` 與 `actions/setup-node@v5`。

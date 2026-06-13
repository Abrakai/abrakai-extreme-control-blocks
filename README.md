# 極限操控方塊 V2.2.4｜全球統計讀取啟動修正版

## 修正重點
- 修正 GitHub Actions 已成功、Firestore 已寫入，但首頁仍停留在「等待」與破折號的問題。
- 根因：`initializeGlobalStats()` 被放在一般 `<script>` 中，無法存取 ES Module 內的 Firebase 函式，因此初始化根本沒有啟動。
- 已將 Firebase 初始化與「讀取最新彙整」按鈕事件移回同一個 ES Module 作用域。
- 公開統計會在首頁載入時自動讀取 `public_stats/summary`。
- 手動按鈕改名為「讀取最新彙整」。
- GitHub Actions 更新為 Node.js 24、`actions/checkout@v5` 與 `actions/setup-node@v5`。


## V2.2.4 統計數字顯示修正
- 全球統計數字維持完整單行，不換行、不省略、不截斷。
- 數字位數增加時，會依每張統計卡片的實際寬度自動縮小字體。
- 手機旋轉、視窗縮放或卡片寬度改變時，會重新計算適合字級。
- 極端大數值仍會以水平比例作最後保護，確保每一位數字都在卡片內完整顯示。

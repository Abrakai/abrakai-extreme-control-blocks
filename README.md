# 極限操控方塊 V2.2.8｜全球統計讀取啟動修正版

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


## V2.2.5 手機鍵盤登入修正
- 玩家帳號與挑戰密碼欄位加入瀏覽器自動填寫抑制標記，降低 Email／密碼建議列遮擋。
- 鍵盤開啟時自動隱藏非必要首頁資訊，保留登入欄位與登入按鈕。
- 依 Visual Viewport 即時調整首頁高度，避免鍵盤出現後留下大面積黑色空白。
- 聚焦輸入欄時自動將欄位捲動到可視區中央；關閉鍵盤後恢復完整首頁。


## V2.2.6 全球使用事件與 10 分鐘更新
- 每次頁面程式成功啟動後，建立一筆 `usage_events/page_launch` 事件。
- 每次正式玩家帳號通過挑戰密碼並進入遊戲後，建立一筆 `usage_events/player_login_play` 事件。
- GitHub Actions 排程改為每 10 分鐘彙整一次。
- 首頁公開看板改用 Firestore `onSnapshot()` 監聽 `public_stats/summary`，彙整完成後已開啟的頁面會自動更新。
- GA4 瀏覽量仍保留在後台摘要中，但首頁主要顯示較快更新的 Firebase 事件計數。
- 事件數是「發生次數」，不是不重複真人數。


## V2.2.7 雲端世界盃冠軍與 5 分鐘全球更新
- 每個 Firebase 匿名 UID（代表目前瀏覽器／裝置資料環境）只保存一份 `world_cup_candidates/{uid}`。
- 該文件永遠代表這台裝置所有本機註冊玩家中的最高分玩家，不上傳挑戰密碼、密碼提示或棋盤存檔。
- GitHub Actions 每 5 分鐘彙整最多前 100 位候選者，依序比較最高分、最高 Level、消除行數與較早達成時間。
- `public_stats/summary` 公開顯示世界盃冠軍暱稱、分數、Level、消除行數與參賽裝置數。
- `world_cup/current` 保存公開前十名資料，供未來製作全球世界盃排行榜使用。
- GitHub 排程並非硬即時計時器，繁忙時仍可能延遲數分鐘。
- 目前候選分數由瀏覽器上傳並受規則限制，但無法完全防止修改前端程式作弊；正式競賽或獎金賽需再加入伺服器端遊戲過程驗證。


## V2.2.8 Firestore 免複合索引統計修正
- 修正 `usage_events` 同時使用 `eventType == page_launch` 與 `occurredAt >= 今日零時` 的聚合查詢，該查詢可能要求額外複合索引並使 GitHub Actions 中止。
- 今日事件改為只依 `occurredAt` 進行單欄位查詢，再由 GitHub Actions 依 `eventType` 分類計算。
- 不需要另外到 Firebase 建立複合索引。
- 保留每 5 分鐘排程、世界盃候選者、冠軍及全球統計功能。
- 執行記錄會顯示是哪一個集合的統計失敗，便於後續維護。

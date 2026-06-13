# 極限操控方塊 V2.1.9｜Firebase 驗證步驟

## 已接入
- Firebase Analytics：自動 page_view，以及 register_success、login_success、guest_start、game_start、game_pause、game_resume、level_start、level_clear、game_over、milestone_level_10、milestone_level_20、leaderboard_open。
- Firebase Anonymous Authentication：每個瀏覽器背景取得匿名 UID。
- Cloud Firestore：players 與 milestones。

## 不會上傳
- 挑戰密碼
- 密碼提示
- 密碼雜湊
- 本機完整棋盤存檔

## 上傳 GitHub Pages 後驗證
1. 開啟 `https://abrakai.github.io/abrakai-extreme-control-blocks/?v=219`。
2. 首頁右上「設定」內應顯示「全球統計：已連線」。
3. Firebase Console → Authentication → 使用者：應出現匿名使用者。
4. 建立一個新本機玩家後，Firestore → 資料：應出現 `players` 集合與一筆文件。
5. 以既有玩家登入／開始遊戲，player 文件的 bestScore、highestLevel、updatedAt 會更新。
6. 通過 Level 10 或 Level 20 後，Firestore 應出現 `milestones` 集合。
7. Google Analytics → 即時：確認 page_view、game_start 等事件。

## 如何看您要的數字
- 總瀏覽量／當日瀏覽量：Google Analytics 報表 → 參與 → 網頁和畫面，查看 Views，日期範圍可設今天或全部期間。
- 全球註冊玩家檔案：Analytics 的 register_success 事件次數，並以 Firestore players 文件作為可稽核資料。
- 破 10 關／20 關：Analytics 的 milestone_level_10 / milestone_level_20 事件次數，並以 Firestore milestones 文件作為唯一里程碑資料。

## 尚未啟用
- 首頁公開顯示全球總數：需要受信任後端更新 `public_stats/summary`。建議後續使用 Cloud Functions（通常需 Blaze）或其他受控後端。
- 全球龍虎榜：目前 Firestore 規則禁止前端直接寫入 leaderboard，避免偽造高分；後續需受信任後端驗證與寫入。
- App Check 強制執行：先測試成功，再啟用 reCAPTCHA Enterprise App Check 並觀察指標，最後才 Enforcement。

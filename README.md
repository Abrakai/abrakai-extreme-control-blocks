# 極限操控方塊 V2.2.0

## 本版新增

- 首頁「全球挑戰數據」公開看板
- 全球註冊挑戰者數
- 累積瀏覽量與今日瀏覽量
- 突破第 10 關與第 20 關人數
- GitHub Actions 每小時自動彙整
- Firestore `public_stats/summary` 唯讀公開摘要

## 部署

GitHub Pages 使用 `index.html`。首次啟用統計前，請依 `GITHUB_ACTIONS_GLOBAL_STATS_SETUP.md` 建立兩個 GitHub Secrets：

- `FIREBASE_SERVICE_ACCOUNT`
- `GA4_PROPERTY_ID`

測試網址：

`https://abrakai.github.io/abrakai-extreme-control-blocks/?v=220`

## 隱私

挑戰密碼、密碼提示、密碼雜湊及完整棋盤存檔不會上傳 Firebase。公開看板只顯示彙總數字。

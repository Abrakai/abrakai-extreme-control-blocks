# 極限操控方塊 V2.1.9｜Firebase 全球統計接入版

## 更新重點
- 接入 Firebase JS SDK 12.14.0（CDN 模組）。
- 啟用 Firebase Analytics，收集匿名頁面與遊戲事件。
- 啟用 Anonymous Authentication，在背景建立匿名 UID。
- 註冊玩家同步到 Firestore `players`，同一瀏覽器可有多個本機玩家文件。
- Level 10 / Level 20 唯一里程碑同步到 Firestore `milestones`。
- 不上傳挑戰密碼、密碼提示、密碼雜湊或完整棋盤存檔。
- Firebase 暫時離線時，本機遊戲、帳號、存檔與本機龍虎榜仍正常運作。
- 首頁設定視窗新增全球統計連線狀態與資料說明。
- 保留 V2.1.8 技能鍵實體上移與登入欄位鎖定修正。

## 重要限制
- 總瀏覽量與當日瀏覽量請在 GA4 查看。
- 公開統計卡片與全球龍虎榜需要後端安全更新，尚未開放前端直接寫入。

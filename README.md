# 極限操控方塊 V2.1.2

## 緊急修正重點
- 強化手機 Chrome / Safari 遊戲中雙擊防誤放大。
- 棋盤、方向鍵、技能鍵與操作區加入 touch-action 防呆。
- 阻止遊戲區 double tap zoom、gesture zoom 與多指縮放。
- 補強 viewport：minimum-scale、maximum-scale、user-scalable=no。
- 補強手機寬度限制：避免首頁標題、登入卡片或遊戲 UI 橫向溢出。
- 所有輸入框維持 16px 以上，避免手機瀏覽器點擊輸入框自動放大。
- 新增 pagehide / beforeunload / visibilitychange 緊急存檔。
- 若高分挑戰中途因瀏覽器重新整理或切出頁面，系統會嘗試保存當前進度與重挑節點。
- 保留 V2.1.1 登入回饋修復。
- 不會刪除玩家帳號、挑戰密碼、最高紀錄、存檔或龍虎榜資料。
- 通過 JavaScript 語法檢查。

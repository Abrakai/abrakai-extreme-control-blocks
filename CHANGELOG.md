# CHANGELOG

## V2.4.5 - 2026-06-16

### Fixed
- 修正高等級玩家缺少正式存檔時固定從 Level 21 開始的問題。
- 修正延續高分時累積消行數被重設為 0 的問題。
- 修正玩家資料、本機龍虎榜與世界盃候選分別取最大值，造成分數、Level、消行數來自不同紀錄的問題。
- 修正過關畫面先清除正式存檔，導致返回首頁或中斷時可能失去下一關進度的問題。
- 修正 Game Over 罩幕仍為 `visibility: hidden` 或結算流程例外時只顯示黑屏的問題。
- 修正全球統計腳本仍寫入 V2.4.3 的版本不一致。
- 補齊 Open Graph 與 Twitter 分享 Meta，統一對外顯示 V2.4.5。

### Added
- 新增完整成績快照 `bestRecord`，確保 `score`、`level`、`lines` 為同一筆紀錄。
- 新增排行榜備份、Retry checkpoint 與正式存檔的唯讀恢復候選。
- 新增暫停／Game Over／重挑／重新開始的二次確認視窗，清楚列出保留項目與放棄代價。
- 鍵盤 `R` 改為先顯示二次確認，避免直接清除本局。
- 新增 `tests/v245-static-check.mjs`，提供版本、續玩、完整快照、Game Over 與二次確認的本機靜態驗證。

### Compatibility
- 保留既有 localStorage key、Firestore collection、Firestore Rules 與 GitHub Actions workflow。
- 未修改任何線上資料或部署設定。

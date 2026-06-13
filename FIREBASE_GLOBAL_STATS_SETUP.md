# 極限操控方塊：全球統計與全球龍虎榜建置規格

## 建議架構
- Firebase Analytics（連接 GA4）：總瀏覽量、當日瀏覽量、裝置與來源分析。
- Firebase Authentication（先啟用匿名登入）：讓每台裝置的雲端寫入具有可驗證身分。
- Cloud Firestore：全球註冊玩家資料、Level 10 / Level 20 里程碑、未來全球龍虎榜。

## 預計統計
1. global_registered_profiles：成功建立的全球玩家檔案數。
2. page_view：網站總瀏覽量與每日瀏覽量（GA4）。
3. level_10_reached：至少通過 Level 10 的玩家數。
4. level_20_reached：至少通過 Level 20 的玩家數。
5. global_leaderboard：未來保存每位玩家最高分，只保留一筆最佳紀錄。

## 重要定義
- 現階段若維持「本機暱稱 + 挑戰密碼」，全球註冊數代表全球建立的玩家檔案數，不保證等於唯一真人數。
- 若要跨裝置、避免重複、真正識別同一位玩家，後續應加入 Google 登入或 Email 登入。

## 需要從 Firebase Console 取得
- apiKey
- authDomain
- projectId
- storageBucket
- messagingSenderId
- appId
- measurementId（G-XXXXXXXXXX）

## Firestore 建議集合
- players/{cloudPlayerId}
- milestones/{cloudPlayerId}
- leaderboards/global/{cloudPlayerId}
- public_stats/summary（若要在網站直接顯示統計數字）

## 下一步
建立 Firebase 專案後，把 Web App 的 firebaseConfig 與 GA4 measurementId 提供給開發端，再完成 V2.1.9 雲端統計正式接線。

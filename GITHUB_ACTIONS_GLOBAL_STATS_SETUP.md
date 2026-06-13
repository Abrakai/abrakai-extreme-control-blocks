# V2.2.0｜GitHub Actions 全球統計設定

這套方案保留 Firebase Spark 免費方案，使用 GitHub Actions 每小時彙整：

- Firestore `players`：全球註冊挑戰者數
- Firestore `milestones`：突破第 10 關與第 20 關人數
- GA4 `screenPageViews`：累積瀏覽量與今日瀏覽量
- Firestore `public_stats/summary`：提供遊戲首頁唯讀顯示

## 一、取得數字形式的 GA4 Property ID

Measurement ID `G-JWWG3ZN83M` 不能直接拿來查詢 Data API。請到：

1. Google Analytics
2. 左下角「管理」
3. 選擇 AbraKai Game Studio 對應的資源
4. 「資源設定」
5. 複製純數字的「資源 ID／Property ID」

例如：`123456789`

## 二、啟用 Google Analytics Data API

在正確的 Google Cloud 專案 `project-44be44c7-5433-4079-aaa` 中啟用：

`Google Analytics Data API`

## 三、建立 GitHub Actions 專用服務帳戶金鑰

1. Google Cloud → IAM 與管理 → 服務帳戶
2. 可使用 Firebase Admin SDK 服務帳戶，或建立專用服務帳戶
3. 讓它具備讀寫 Firestore 的權限（建議最小權限；測試階段可使用 Cloud Datastore User）
4. 建立 JSON 金鑰並下載
5. JSON 只放 GitHub Secret，禁止提交到 Repository

## 四、把服務帳戶加入 GA4 資源

1. Google Analytics → 管理
2. 資源存取權管理
3. 新增使用者
4. 輸入 JSON 內的 `client_email`
5. 權限選「檢視者」

## 五、建立 GitHub Repository Secrets

Repository：`abrakai-extreme-control-blocks`

路徑：Settings → Secrets and variables → Actions → New repository secret

新增兩個 Secrets：

### `FIREBASE_SERVICE_ACCOUNT`

內容：完整貼上服務帳戶 JSON。

### `GA4_PROPERTY_ID`

內容：純數字 Property ID，例如 `123456789`。

## 六、上傳檔案

請保留以下路徑：

- `.github/workflows/update-public-stats.yml`
- `scripts/update-public-stats.mjs`
- `package.json`
- `package-lock.json`
- `index.html`

## 七、第一次手動執行

1. GitHub Repository → Actions
2. 左側選 `Update public global stats`
3. 按 `Run workflow`
4. 等待綠色勾勾
5. Firebase → Firestore → `public_stats` → `summary`
6. 遊戲首頁按「重新整理」，應顯示公開數字

## 八、統計定義

- 全球註冊挑戰者：Firestore `players` 文件數
- 突破第 10 關：`milestones` 中 `milestone == 10` 文件數
- 突破第 20 關：`milestones` 中 `milestone == 20` 文件數
- 累積瀏覽量：GA4 `screenPageViews` 自 2020-01-01 至今天
- 今日瀏覽量：GA4 今日 `screenPageViews`

GA4 可能有資料處理延遲；GitHub 排程也不保證精準到分鐘，因此首頁會顯示最後彙整時間。

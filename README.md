# 極限操控方塊 V2.2.1｜全球統計無金鑰驗證版

## 本版重點

- GitHub Actions 改用 OIDC + Google Cloud Workload Identity Federation。
- 不需要建立或保存長效 Service Account JSON 私鑰。
- 使用 `google-github-actions/auth@v3` 取得短效 Application Default Credentials。
- Firestore 統計改用 `@google-cloud/firestore`，與 WIF/ADC 相容。
- GA4 Data API 也使用同一組短效 ADC 憑證。
- 首頁全球挑戰數據看板維持不變。

## GitHub Secrets

需要三個 Repository Secrets：

- `GA4_PROPERTY_ID`：`541602933`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`：建立 Provider 後取得的完整 resource name
- `GCP_SERVICE_ACCOUNT`：`github-stats@project-44be44c7-5433-4079-aaa.iam.gserviceaccount.com`

不再需要：

- `FIREBASE_SERVICE_ACCOUNT`

## 部署

把 ZIP 內全部檔案覆蓋至 Repository 根目錄，保留 `.github` 隱藏資料夾。

測試網址：

`https://abrakai.github.io/abrakai-extreme-control-blocks/?v=221`

# V2.2.2｜GitHub Actions 無金鑰驗證設定

本版使用 GitHub OIDC + Google Cloud Workload Identity Federation，不建立 Service Account 私密金鑰。

## 已知專案資料

- Google Cloud Project ID：`project-44be44c7-5433-4079-aaa`
- Google Cloud Project Number：`287079960129`
- GitHub Repository：`Abrakai/abrakai-extreme-control-blocks`
- GA4 Property ID：`541602933`
- 專用 Service Account：`github-stats@project-44be44c7-5433-4079-aaa.iam.gserviceaccount.com`

## 一、用 Cloud Shell 建立 WIF

進入 Google Cloud Console，確認選到 `project-44be44c7-5433-4079-aaa`，開啟右上角 Cloud Shell，完整貼上：

```bash
set -euo pipefail

PROJECT_ID="project-44be44c7-5433-4079-aaa"
PROJECT_NUMBER="287079960129"
REPO="Abrakai/abrakai-extreme-control-blocks"
POOL_ID="github-actions"
PROVIDER_ID="abrakai-extreme-control-blocks"
SA_NAME="github-stats"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud config set project "$PROJECT_ID"

gcloud services enable   iam.googleapis.com   iamcredentials.googleapis.com   sts.googleapis.com   firestore.googleapis.com   analyticsdata.googleapis.com

if ! gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SA_NAME"     --project="$PROJECT_ID"     --display-name="GitHub Global Stats"
fi

gcloud projects add-iam-policy-binding "$PROJECT_ID"   --member="serviceAccount:${SA_EMAIL}"   --role="roles/datastore.user"   --condition=None

if ! gcloud iam workload-identity-pools describe "$POOL_ID"   --project="$PROJECT_ID" --location="global" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "$POOL_ID"     --project="$PROJECT_ID"     --location="global"     --display-name="GitHub Actions Pool"
fi

if ! gcloud iam workload-identity-pools providers describe "$PROVIDER_ID"   --project="$PROJECT_ID" --location="global"   --workload-identity-pool="$POOL_ID" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID"     --project="$PROJECT_ID"     --location="global"     --workload-identity-pool="$POOL_ID"     --display-name="AbraKai global stats"     --issuer-uri="https://token.actions.githubusercontent.com"     --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner,attribute.ref=assertion.ref"     --attribute-condition="assertion.repository == '${REPO}' && assertion.ref == 'refs/heads/main'"
fi

POOL_NAME=$(gcloud iam workload-identity-pools describe "$POOL_ID"   --project="$PROJECT_ID" --location="global" --format="value(name)")

PROVIDER_NAME=$(gcloud iam workload-identity-pools providers describe "$PROVIDER_ID"   --project="$PROJECT_ID" --location="global"   --workload-identity-pool="$POOL_ID" --format="value(name)")

gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL"   --project="$PROJECT_ID"   --role="roles/iam.workloadIdentityUser"   --member="principalSet://iam.googleapis.com/${POOL_NAME}/attribute.repository/${REPO}"

echo "========================================"
echo "GCP_WORKLOAD_IDENTITY_PROVIDER=${PROVIDER_NAME}"
echo "GCP_SERVICE_ACCOUNT=${SA_EMAIL}"
echo "========================================"
```

執行完成後，請複製最後兩行等號右邊的值。

## 二、把 Service Account 加入 GA4

1. Google Analytics → 管理
2. 資源 → 資源存取權管理
3. 右上角 `+` → 新增使用者
4. Email：`github-stats@project-44be44c7-5433-4079-aaa.iam.gserviceaccount.com`
5. 角色：`檢視者`
6. 新增

## 三、建立 GitHub Secrets

Repository → Settings → Secrets and variables → Actions

建立／更新：

- `GA4_PROPERTY_ID` = `541602933`
- `GCP_WORKLOAD_IDENTITY_PROVIDER` = Cloud Shell 最後輸出的 Provider 完整名稱
- `GCP_SERVICE_ACCOUNT` = `github-stats@project-44be44c7-5433-4079-aaa.iam.gserviceaccount.com`

不需要建立 `FIREBASE_SERVICE_ACCOUNT`。

## 四、上傳 V2.2.2 檔案

必須包含：

- `.github/workflows/update-public-stats.yml`
- `scripts/update-public-stats.mjs`
- `package.json`
- `package-lock.json`
- `index.html`

## 五、第一次手動執行

1. GitHub → Actions
2. `Update public global stats`
3. `Run workflow`
4. Branch 選 `main`
5. 按綠色 `Run workflow`

若成功，Firebase Firestore 會出現：

- `public_stats`
  - `summary`

首頁按「重新整理」即可讀取。


## 若舊版卡在 Install dependencies
V2.2.1 的 package-lock 曾誤帶開發環境內部套件網址。V2.2.2 已改回 npm 官方公開 registry。請取消舊執行、上傳 V2.2.2 後重新執行。


## V2.2.6 排程與資料來源
- 工作流程排程：`*/10 * * * *`，約每 10 分鐘執行一次。
- `usage_events` 由網頁前端建立，只允許已通過 Firebase Anonymous Authentication 的使用者新增。
- 公開摘要仍由 GitHub Actions 的無金鑰 WIF 身分寫入。
- 上傳新版後，請把新版 `firestore.rules` 複製到 Firebase Console 的 Firestore 規則並發布。


## V2.2.7 世界盃資料與五分鐘排程
1. 將新版 `firestore.rules` 完整貼到 Firebase Console → Firestore → 規則，並按「發布」。
2. 工作流程排程為 `2-57/5 * * * *`，即每小時的 02、07、12、17……57 分執行。
3. 首次上傳新版後，請到 GitHub Actions 手動執行一次 `Update public global stats`，不必等待排程。
4. Firestore 應出現：
   - `world_cup_candidates/{匿名UID}`：每個瀏覽器／裝置的本機最高分候選者。
   - `world_cup/current`：全球冠軍與前十名公開資料。
   - `public_stats/summary`：首頁公開統計與冠軍欄位。
5. 既有三個 GitHub Secrets 不需變更。


## V2.2.8 索引說明
本版已取消 `eventType + occurredAt` 的複合聚合查詢。今日事件改為單獨查詢 `occurredAt`，再由 Node.js 分類計算，因此不需要在 Firebase Console 額外建立複合索引。上傳後直接手動執行一次 GitHub Actions 即可驗證。


## V2.2.9 榮譽榜定位與候選同步
世界盃功能定位為全球榮譽排行，只做成績與頭銜展示。

每個 Firebase 匿名 UID 只保存一份 `world_cup_candidates/{uid}`。
候選紀錄會在網頁開啟、正式玩家登入、開始遊戲、過關、結算與分數提交時重新檢查；
只有較高的本機最高分才會覆寫同一份雲端候選紀錄。


## V2.3.0 必做設定
1. 將新版 `firestore.rules` 完整貼到 Firebase Console → Firestore → 規則，按「發布」。
2. 新增公開安全集合：
   - `public_activity_events`
   - `public_player_markers`
   - `public_milestone10_markers`
   - `public_milestone20_markers`
   這些集合由程式自動建立，不需手動新增。
3. 世界盃候選同步後，可直接更新 `world_cup/current` 的冠軍欄位；GitHub Actions 仍每 5 分鐘整理前十名及官方摘要。
4. 上傳完成後手動執行一次 `Update public global stats`，建立 V2.3.0 官方基準。
5. 既有三個 GitHub Secrets 不需修改。


## V2.3.3 必做：重新發布 Firestore Rules
V2.3.2 的 `world_cup_candidates` 規則禁止所有讀取，但前端同步流程必須先讀取自己的候選文件。
請將本版 `firestore.rules` 完整貼到 Firebase Console → Firestore → 規則，然後按「發布」。

發布後重新整理正式網站，或按首頁「更新數據」，即可重新觸發世界盃候選同步。


## V2.3.5 世界盃雙來源彙整
GitHub Actions 現在同時讀取：
- `world_cup_candidates`
- `world_cup_submissions`

並以匿名裝置 UID 去重，只保留每台裝置的最佳紀錄，再回填：
- `world_cup/current`
- `public_stats/summary`

請先發布 V2.3.5 的 `firestore.rules`，否則瀏覽器無法建立 `world_cup_submissions`。

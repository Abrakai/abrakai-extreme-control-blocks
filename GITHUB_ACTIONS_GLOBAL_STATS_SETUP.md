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

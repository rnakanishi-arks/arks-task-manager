# ARKS タスク管理アプリ

チーム共有タスク管理Webアプリ（Next.js + Vercel）

## 機能

- ログイン（ID・パスワード認証）
- ロール管理（管理者 / メンバー）
- タスクの作成・個人共有・グループ共有
- タスク内容の編集
- ステータス変更（未完了 / 進行中 / 完了 / 保留 / 期限超過）
- ステータス変更時の通知
- 管理画面（ユーザー・グループ管理）
- ダッシュボード（サマリー・通知一覧）

## セットアップ

### ローカルで動かす

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く。

### デモアカウント

| ロール | メール | パスワード |
|--------|--------|-----------|
| 管理者 | admin@arks.co.jp | admin123 |
| メンバー | tanaka@arks.co.jp | pass123 |
| メンバー | suzuki@arks.co.jp | pass123 |
| メンバー | sato@arks.co.jp | pass123 |

## GitHub + Vercel へのデプロイ手順

### 1. GitHubにリポジトリを作成

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/あなたのユーザー名/arks-task-manager.git
git push -u origin main
```

### 2. Vercelにデプロイ

1. https://vercel.com にアクセスしてGitHubアカウントでログイン
2. 「Add New Project」→ 作成したリポジトリを選択
3. 設定はデフォルトのままで「Deploy」をクリック
4. デプロイ完了後、URLが発行される（例: arks-task-manager.vercel.app）

### 3. チームに共有

発行されたURLをチームメンバーに共有するだけでOK。

## データについて

現在はブラウザのlocalStorageにデータを保存しています。
**同じURLにアクセスしても、データは各自のブラウザに保存されます。**

### チームで同じデータを共有するには

本番運用では以下への移行を推奨します：

- **Supabase**（無料プランあり・PostgreSQL）
- **PlanetScale**（MySQL）
- **Firebase Firestore**（NoSQL）

`lib/store.ts` の各Store関数をAPIコールに置き換えるだけで移行できる構造にしています。

## ファイル構成

```
app/
  page.tsx          # ルートリダイレクト
  layout.tsx        # 共通レイアウト
  globals.css       # グローバルスタイル
  login/page.tsx    # ログイン画面
  dashboard/page.tsx # ダッシュボード
  tasks/
    page.tsx        # タスク一覧
    new/page.tsx    # タスク作成
    [id]/page.tsx   # タスク詳細・編集
  admin/page.tsx    # 管理画面
components/
  AppShell.tsx      # サイドバー付きレイアウト
lib/
  store.ts          # データ層（localStorage）
```

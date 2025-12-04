# Sales Manager - 顧客・売上管理システム

顧客情報と売上データを効率的に管理するWebアプリケーションです。

## プロジェクト概要

Sales Managerは、中小企業やフリーランス向けの顧客・売上管理システムです。
シンプルなUIで顧客情報の登録、売上データの記録、月次レポートの確認が行えます。

## 使用技術

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| UIコンポーネント | shadcn/ui, Radix UI |
| 認証 | NextAuth.js v5 |
| データベース | PostgreSQL (Supabase) |
| ORM | Prisma |
| チャート | Recharts |
| アイコン | Lucide React |

## 機能一覧

### 認証
- メール/パスワード認証
- Google OAuth認証（オプション）

### ダッシュボード
- 時間帯別ウェルカムメッセージ
- 今月のサマリー（売上、取引件数、顧客数、平均取引額）
- 直近の売上・顧客一覧

### 顧客管理
- 顧客の登録・編集・削除
- 名前・メール・電話番号での検索
- ページネーション
- Excelエクスポート

### 売上管理
- 売上の登録・編集・削除
- 顧客紐付け
- 期間・顧客でのフィルタリング
- ページネーション
- Excelエクスポート

### レポート
- 月次売上レポート
- 前月比較
- 日別売上チャート
- 顧客別売上ランキング

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/customer-sales-manager.git
cd customer-sales-manager
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを編集し、以下の値を設定してください：

- `DATABASE_URL`: Supabase PostgreSQL接続文字列（Pooler）
- `DIRECT_URL`: Supabase PostgreSQL直接接続文字列
- `NEXTAUTH_SECRET`: ランダムな秘密鍵
- `NEXTAUTH_URL`: アプリケーションURL
- `GOOGLE_CLIENT_ID`: Google OAuth クライアントID（オプション）
- `GOOGLE_CLIENT_SECRET`: Google OAuth シークレット（オプション）

### 4. データベースのセットアップ

```bash
# Prismaクライアントの生成
npx prisma generate

# データベースマイグレーション
npx prisma db push

# （オプション）シードデータの投入
npx prisma db seed
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

## 環境変数の説明

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL接続文字列（Connection Pooling） | ○ |
| `DIRECT_URL` | PostgreSQL直接接続文字列（Migration用） | ○ |
| `NEXTAUTH_URL` | アプリケーションのベースURL | ○ |
| `NEXTAUTH_SECRET` | NextAuth.jsの暗号化キー | ○ |
| `GOOGLE_CLIENT_ID` | Google OAuthクライアントID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuthシークレット | - |

## デモアカウント

ローカル環境でシードデータを投入した場合、以下のアカウントでログインできます：

| メールアドレス | パスワード |
|---------------|-----------|
| demo@example.com | demo1234 |

## スクリプト

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm run start

# リント
npm run lint

# Prisma Studio（データベースGUI）
npx prisma studio
```

## ディレクトリ構成

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証関連ページ
│   ├── (dashboard)/       # ダッシュボードページ
│   └── api/               # APIルート
├── components/            # Reactコンポーネント
│   ├── dashboard/         # ダッシュボード用
│   ├── forms/             # フォーム
│   ├── layouts/           # レイアウト
│   └── ui/                # UIコンポーネント
├── hooks/                 # カスタムフック
└── lib/                   # ユーティリティ
```

## ライセンス

MIT

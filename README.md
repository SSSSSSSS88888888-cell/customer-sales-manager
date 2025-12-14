# ZaimuAI - AI財務諸表メーカー

仕訳入力だけで財務諸表（BS・PL・CF）を自動生成するAI財務諸表メーカーです。

## プロジェクト概要

ZaimuAIは、中小企業や個人事業主向けの財務諸表作成システムです。
シンプルなUIで仕訳を入力するだけで、貸借対照表・損益計算書・キャッシュフロー計算書を自動生成します。

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
| アイコン | Lucide React |

## 機能一覧

### 認証
- メール/パスワード認証
- Google OAuth認証（オプション）
- ゲストログイン（サンプルデータ付き）

### ダッシュボード
- 財務サマリー（仕訳件数、勘定科目数、取引額）
- 直近の仕訳一覧
- 財務諸表へのクイックアクセス

### 仕訳管理
- 仕訳の登録・編集・削除
- 借方・貸方の勘定科目選択
- 日付・金額・摘要の入力
- 標準勘定科目マスタ

### 財務諸表
- **貸借対照表（B/S）**: 資産・負債・純資産を自動集計、貸借バランスチェック
- **損益計算書（P/L）**: 売上高から当期純利益まで自動計算、収益性分析
- **キャッシュフロー計算書（C/F）**: 営業・投資・財務活動別に現金の流れを可視化

### 出力機能
- PDF出力（予定）
- Excel出力（予定）

### AI分析（将来予定）
- トレンド分析
- 異常検知
- 改善提案

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/zaimu-ai.git
cd zaimu-ai
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

## ゲストログイン

「ゲストとして試す」ボタンから、サンプルデータ付きでアプリを体験できます。
- 標準勘定科目マスタ（30科目以上）
- サンプル仕訳データ（月別の売上・仕入・経費）
- 財務諸表の確認

※ゲストデータは24時間後に自動削除されます。

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
│   │   ├── dashboard/     # メインダッシュボード
│   │   ├── journals/      # 仕訳管理
│   │   ├── statements/    # 財務諸表
│   │   │   ├── bs/       # 貸借対照表
│   │   │   ├── pl/       # 損益計算書
│   │   │   └── cf/       # キャッシュフロー
│   │   └── analysis/      # AI分析
│   └── api/               # APIルート
├── components/            # Reactコンポーネント
│   ├── layouts/           # レイアウト
│   └── ui/                # UIコンポーネント
├── hooks/                 # カスタムフック
└── lib/                   # ユーティリティ
```

## データモデル

### ChartOfAccount（勘定科目マスタ）
- code: 勘定科目コード（101, 401など）
- name: 勘定科目名（現金、売上高など）
- type: 区分（ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE）
- category: カテゴリ（流動資産、固定資産、売上原価など）

### Journal（仕訳）
- date: 仕訳日付
- debitAccountId: 借方勘定科目
- creditAccountId: 貸方勘定科目
- amount: 金額
- description: 摘要

## ライセンス

MIT

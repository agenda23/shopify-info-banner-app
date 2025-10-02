# Shopify インフォメーションバナーマネージャーアプリ

Shopifyストアのページ最上部に、期間や表示回数を細かく設定可能なインフォメーションバナーを容易に表示・管理するアプリケーションです。

## 🚀 概要

このアプリは、Shopifyマーチャントがストアフロントにインフォメーションバナーを簡単に設置・管理できるツールです。表示期間、対象ページ、表示頻度などの詳細な設定が可能で、従量課金システムも含んでいます。

## ✨ 主な機能

### バナー管理機能
- バナーの追加・編集・削除
- バナー内容設定（文言、リンクURL、バナー名）
- バナーデザイン設定（背景色、文字色、フォントサイズ）
- 自動表示設定（表示開始・終了日時）
- 表示対象ページ選択（全ページ、特定パス、除外パス）

### 表示制御機能
- 表示パターン設定（常に表示、一回のみ、一日一度のみ）
- 複数パターン表示設定（優先度順、ローテーション、ランダム）
- カウントダウンバナー

### プラン管理・利用トラッキング機能
- 表示回数のトラッキング
- 定額プラン制対応（Shopify Recurring Application Charge API）
- プラン管理機能（アップグレード・ダウングレード）
- プラン制限超過時の制御
- 利用状況表示

## 🛠 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | React, Polaris (Shopify UI), React Router |
| バックエンド | Cloudflare Workers (JavaScript/TypeScript) |
| データベース | Cloudflare D1 (SQLite) |
| ホスティング | Cloudflare Pages (フロントエンド), Cloudflare Workers (バックエンド) |
| 認証 | Shopify OAuth 2.0, App Bridge Session Token |

## 📋 前提条件

- Node.js (v18以上)
- npm または yarn
- Cloudflareアカウント
- Shopifyパートナーアカウント
- Wrangler CLI

## 🚀 セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd shopify-info-banner-app
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env`ファイルを作成し、以下の環境変数を設定してください：

```env
# Shopify設定
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders

# Cloudflare設定
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# アプリ設定
APP_URL=https://your-app-domain.com
```

### 4. Cloudflare D1データベースのセットアップ

```bash
# D1データベースの作成
wrangler d1 create shopify-banner-db

# スキーマの適用
wrangler d1 execute shopify-banner-db --file=./schema.sql
```

### 5. 開発サーバーの起動

```bash
# フロントエンド開発サーバー
npm run dev

# Workers開発サーバー（別ターミナル）
wrangler dev
```

## 📁 プロジェクト構造

```
shopify-info-banner-app/
├── docs/                          # ドキュメント
│   ├── Shopifyバナーマネージャーアプリ 要件定義書.md
│   ├── Shopifyバナーマネージャーアプリ 開発仕様書.md
│   ├── Shopifyバナーマネージャーアプリ 開発手順書.md
│   ├── Shopifyバナーマネージャーアプリ 開発 Todoリスト.md
│   ├── アカウント作成手順書.md
│   ├── セキュリティ要件.md
│   ├── 運用・監視要件.md
│   └── 開発環境セットアップガイド.md
├── workers/                       # Cloudflare Workers
│   ├── schema.sql                 # D1データベーススキーマ
│   └── wrangler.toml              # Wrangler設定
├── .env.example                   # 環境変数テンプレート
├── .eslintrc.cjs                  # ESLint設定
├── .gitignore                     # Git除外設定
├── .prettierrc                    # Prettier設定
├── package.json                   # プロジェクト設定
├── README.md                      # このファイル
├── tsconfig.json                  # TypeScript設定
├── tsconfig.node.json             # TypeScript Node設定
└── vite.config.ts                 # Vite設定
```

## 🗄 データベーススキーマ

### banners テーブル
バナーの設定情報を保存

### user_history テーブル
表示頻度制御用のユーザー履歴

### usage_tracker テーブル
月間表示回数トラッキング用

詳細なスキーマについては、`docs/Shopifyバナーマネージャーアプリ 開発仕様書.md`を参照してください。

## 💰 課金プラン

| プラン名 | 月間表示回数制限 | 月額料金 | 対象 |
|---------|----------------|---------|------|
| フリープラン | 1,000回まで | $0.00 | 小規模ストア |
| ベーシックプラン | 10,000回まで | $9.99 | 中規模ストア |
| プロプラン | 50,000回まで | $29.99 | 大規模ストア |
| エンタープライズプラン | 無制限 | $99.99 | エンタープライズ |

## 🧪 テスト

```bash
# ユニットテスト
npm run test

# エンドツーエンドテスト
npm run test:e2e
```

## 🚀 デプロイ

### フロントエンド（Cloudflare Pages）

```bash
npm run build
wrangler pages deploy dist
```

### バックエンド（Cloudflare Workers）

```bash
wrangler deploy
```

## 📚 ドキュメント

詳細な仕様や開発手順については、`docs/`ディレクトリ内のドキュメントを参照してください：

### 📋 基本ドキュメント
- [プロジェクト概要](docs/プロジェクト概要.md) - プロジェクト全体の概要
- [要件定義書](docs/Shopifyバナーマネージャーアプリ%20要件定義書.md) - 機能要件・非機能要件
- [開発仕様書](docs/Shopifyバナーマネージャーアプリ%20開発仕様書.md) - 技術仕様・データベース設計
- [開発手順書](docs/Shopifyバナーマネージャーアプリ%20開発手順書.md) - 実装手順・開発フロー
- [開発Todoリスト](docs/Shopifyバナーマネージャーアプリ%20開発%20Todoリスト.md) - 開発タスク一覧

### 🛠 セットアップ・運用
- [アカウント作成手順書](docs/アカウント作成手順書.md) - Shopify・Cloudflareアカウント作成
- [開発環境セットアップガイド](docs/開発環境セットアップガイド.md) - ローカル開発環境構築
- [セキュリティ要件](docs/セキュリティ要件.md) - セキュリティ仕様・対策
- [運用・監視要件](docs/運用・監視要件.md) - 監視・ログ・バックアップ

### 📝 プロジェクト管理
- [CHANGELOG](docs/CHANGELOG.md) - 変更履歴
- [CONTRIBUTING](docs/CONTRIBUTING.md) - コントリビューションガイド

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 📞 サポート

質問や問題がある場合は、GitHubのIssuesページでお知らせください。

---

**注意**: このアプリは開発中です。本番環境での使用前に十分なテストを行ってください。


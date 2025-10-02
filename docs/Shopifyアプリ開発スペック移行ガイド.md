# Shopifyアプリ開発スペック移行ガイド

## 概要

このガイドでは、既存のプロジェクトをShopifyのアプリ開発スペックに準拠させるための移行手順を説明します。

## 移行前の状況

### 問題点
- Shopify CLI対応の欠如
- 認証・認可システムの未実装
- App Bridge統合の欠如
- 必須Webhook処理の未実装
- 非標準的なアプリ構造

### 影響
- Shopify管理画面への埋め込みができない
- アプリのインストール・認証ができない
- 必須のWebhook処理が動作しない
- 開発・デプロイツールとの互換性がない

## 移行手順

### 1. Shopify CLI対応の実装

#### 1.1 設定ファイルの作成
```bash
# shopify.app.toml の作成
# shopify.web.toml の作成
```

#### 1.2 依存関係の更新
```bash
npm install @shopify/shopify-app-express @shopify/shopify-app-session-storage-sqlite @shopify/shopify-api
```

### 2. 認証システムの実装

#### 2.1 Session Token認証
- `app/lib/shopify.server.ts` の実装
- OAuth 2.0フローの設定
- Token Exchangeの実装

#### 2.2 App Bridge統合
- `app/lib/app-bridge.ts` の実装
- Shopify管理画面への埋め込み対応

### 3. 必須Webhook処理の実装

#### 3.1 アプリアンインストール時
- `app/routes/api.webhooks.app.uninstalled.ts`
- データクリーンアップ機能

#### 3.2 スコープ更新時
- `app/routes/api.webhooks.app.scopes_update.ts`
- 権限変更の処理

#### 3.3 プライバシー関連
- `app/routes/api.webhooks.customers.data_request.ts`
- GDPR対応のデータ要求処理

### 4. プロジェクト構造の変更

#### 4.1 ディレクトリ構造
```
app/
├── routes/           # ルート定義
├── components/       # Reactコンポーネント
├── lib/             # ライブラリ・ユーティリティ
└── hooks/           # カスタムフック
```

#### 4.2 エントリーポイント
- `app/root.tsx` - ルートコンポーネント
- `app/entry.server.tsx` - サーバーエントリーポイント

### 5. データベース接続の実装

#### 5.1 データベース抽象化
- `app/lib/database.server.ts`
- Cloudflare D1対応

#### 5.2 セッション管理
- SQLiteセッションストレージ
- セッション永続化

## 移行後の確認事項

### 1. 認証フローの確認
- [ ] OAuth 2.0フローが正常に動作する
- [ ] Session Token認証が機能する
- [ ] Token Exchangeが動作する

### 2. App Bridge統合の確認
- [ ] Shopify管理画面にアプリが表示される
- [ ] 埋め込みアプリとして正常に動作する
- [ ] セッション管理が機能する

### 3. Webhook処理の確認
- [ ] アプリアンインストール時のクリーンアップが動作する
- [ ] スコープ更新時の処理が機能する
- [ ] プライバシー関連Webhookが動作する

### 4. 開発環境の確認
- [ ] `shopify app dev` が正常に動作する
- [ ] 開発ストアでのテストが可能
- [ ] ホットリロードが機能する

## トラブルシューティング

### よくある問題と解決方法

#### 1. 認証エラー
**問題**: Session Token認証が失敗する
**解決方法**: 
- 環境変数の設定を確認
- App Bridgeの初期化を確認
- セッションストレージの設定を確認

#### 2. Webhook受信エラー
**問題**: Webhookが受信されない
**解決方法**:
- Webhook URLの設定を確認
- 認証設定を確認
- ネットワーク設定を確認

#### 3. アプリ表示エラー
**問題**: Shopify管理画面にアプリが表示されない
**解決方法**:
- `shopify.app.toml` の設定を確認
- アプリの埋め込み設定を確認
- App Bridgeの初期化を確認

## 次のステップ

### 1. 機能実装
- バナー管理機能の実装
- ストアフロント統合の実装
- 課金システムの実装

### 2. テスト
- ユニットテストの実装
- 統合テストの実装
- E2Eテストの実装

### 3. デプロイ
- 本番環境へのデプロイ
- アプリストアへの申請
- 監視・ログ設定

## 参考資料

- [Shopify App Development](https://shopify.dev/docs/apps)
- [Shopify CLI Documentation](https://shopify.dev/docs/api/shopify-cli)
- [App Bridge Documentation](https://shopify.dev/docs/api/app-bridge)
- [Webhook Documentation](https://shopify.dev/docs/apps/build/webhooks)

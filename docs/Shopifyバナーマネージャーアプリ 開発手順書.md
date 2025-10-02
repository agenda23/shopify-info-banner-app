## . 環境構築フェーズ

### 1.1. 開発環境のセットアップ

1. **Shopify Partnersアカウントの作成とアプリ登録:** アプリ情報（名前、リダイレクトURLなど）を登録する。
    
2. **Cloudflareアカウントの作成:** Cloudflare Pages, Workers, D1を利用するためのアカウントを設定する。
    
3. **ローカル環境の準備:** Node.js, npm, `wrangler` (Cloudflare CLI) をインストールする。
    
4. **プロジェクト初期化:** Shopify CLI (or `npm init @shopify/app`) を使用してReactテンプレートプロジェクトをセットアップする。
    

### 1.2. Cloudflareインフラのセットアップ

1. **Workersプロジェクト作成:** Reactプロジェクトとは別に、Cloudflare Workersプロジェクトを初期化し、`wrangler.toml`を設定する。
    
2. **D1データベースの作成:** `wrangler d1 create <DB_NAME>` コマンドでD1インスタンスを作成する。
    
3. **D1スキーマ適用 (更新):** D1に`banners`、`user_history`、**`usage_tracker`**テーブルの初期スキーマを適用する。**`banners`テーブルには`target_type`と`target_paths`フィールドを含める。**
    
4. **Workers Cron Triggers設定 (新規):** `wrangler.toml`に、**Shopifyへの課金レポート**を定期実行するための設定を追記する。
    

## 2. コア機能開発フェーズ

### 2.1. Workers (API) 開発

1. **認証処理実装:** Shopify OAuth (インストール/認証フロー) と、App Bridgeからのリクエスト検証ロジックをWorkersに実装する。
    
2. **D1 CRUD API実装:**
    
    - `GET /api/banners`: バナー一覧取得。
        
    - `POST /api/banners`: 新規バナー作成。**`target_type`と`target_paths`のバリデーションを含める。**
        
    - `PUT /api/banners/{id}`: バナー更新。
        
    - `DELETE /api/banners/{id}`: バナー削除。
        
3. **Webhookエンドポイント実装:** `app/uninstalled` Webhookを受け取るエンドポイントを実装し、データクリーンアップ処理を記述する。
    
4. **課金トラッキングAPI実装 (新規):**
    
    - `POST /api/track-usage/{shop_id}`: ストアフロントからの表示通知を受け取り、D1の**`usage_tracker`**をインクリメントするロジックを実装。
        
5. **利用状況確認API実装 (新規):**
    
    - `GET /api/usage-status/{shop_id}`: 当月の`display_count`と超過ステータス（`is_over_limit: boolean`）を返す。
        
6. **課金レポートロジック実装 (新規 - Cron Triggers):**
    
    - Cron Triggersで実行される関数を実装し、D1データに基づきUsage Chargeを計算・レポートする。
        

### 2.2. React (管理画面) 開発

1. **App Bridgeセットアップ:** ReactコンポーネントにApp Bridgeを組み込み、Shopify管理画面との連携を確立する。
    
2. **UIコンポーネント開発 (更新):** Polarisを使用して、バナー一覧、新規作成/編集フォームを開発する。
    
    - **表示対象ページ設定UI (新規):** バナー編集フォームに、`target_type` (ラジオボタン/ドロップダウン) と `target_paths` (タグ入力/複数行テキストエリア) を設定するためのUIコンポーネントを追加する。
        
3. **API連携実装:** ReactコンポーネントからWorkers APIを呼び出し、データの表示・保存・更新・削除処理を実装する。
    
4. **課金状況・超過アラート表示実装 (新規):**
    
    - アプリのメイン画面ロード時に、`GET /api/usage-status/{shop_id}`を呼び出す。
        
    - 応答で**`is_over_limit`が`true`**の場合、画面最上部にPolarisの**`Banner`コンポーネント**を用いて、アップグレードを促す警告メッセージと、課金承認画面へ遷移するためのボタンを設置する。
        

## 3. ストアフロント連携フェーズ

### 3.1. 表示用スクリプト開発 (Workers - 更新)

1. `GET /storefront-script/{shop_id}.js` エンドポイントをWorkersに実装する。
    
2. **無料枠超過チェック実装 (新規):** バナーデータ取得前に、D1から`display_count`を取得し、**1,000回を超過している場合は表示を停止する**。
    
3. このJSファイル内で、Shopifyストアに埋め込まれた状態で動作する以下のロジックを実装:
    
    - Workersのデータ取得API (`/api/display/{shop_id}`) を呼び出すロジック。
        
    - Workers側のレスポンスで受け取ったバナーデータに基づき、以下の判定を行う:
        
        - **ページパス判定ロジック:** クライアント側の現在のURLパスを取得し、Workersから受け取った`target_type`と`target_paths`に基づき、バナーを表示するかどうかを最終判定するロジックを実装する。
            
    - 表示条件（期間、頻度、複数パターン）を判定するロジック。
        
    - バナー表示成功後、非同期で`/api/track-usage/{shop_id}`を呼び出すロジックを実装。
        

### 3.2. Script Tag API連携

1. アプリインストール完了後、Shopify Admin APIを通じて、`/storefront-script/{shop_id}.js`をScript Tagとして登録する処理をWorkersに実装する。
    

## 4. テスト・デプロイフェーズ

### 4.1. テスト

1. **ユニットテスト:** Workers APIのデータ処理、表示ロジック、**課金トラッキングAPI**のテスト。
    
2. **超過制御テスト:** `display_count`を操作し、表示停止および管理画面アラートが正しく機能することを確認する。
    
3. **ページパス判定テスト (新規):**
    
    - `target_type: 'include'`, `target_paths: ["/products/*"]` の設定で、`/products/a`では表示され、`/collections/b`では非表示になることを確認。
        
    - `target_type: 'exclude'`, `target_paths: ["/pages/faq"]` の設定で、FAQページでのみ非表示になることを確認。
        
4. **エンドツーエンドテスト:** 開発ストアにアプリをインストールし、ストアフロントにバナーが正しく表示・動作することを確認する。
    

### 4.2. デプロイ

1. **Shopifyパートナー設定 (課金設定):** アプリ設定で月額プランとUsage Charge（上限$49.99）を設定する。
    
2. **Cloudflare Pagesデプロイ:** React管理画面をCloudflare Pagesにデプロイする。
    
3. **Cloudflare Workersデプロイ:** Workers APIをデプロイし、D1とのバインディングおよび**Cron Triggers**を設定する。
    
4. **Shopifyアプリ設定更新:** デプロイ後のURLをShopifyパートナー管理画面のリダイレクトURLに設定し、最終確認を行う。
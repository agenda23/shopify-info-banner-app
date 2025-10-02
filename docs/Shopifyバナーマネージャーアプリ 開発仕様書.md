## 技術スタックとアーキテクチャ

### 1.1. 技術スタック

|領域|技術|備考|
|---|---|---|
|フロントエンド (App UI)|React, Polaris (ShopifyのUIコンポーネント), React Router|Shopify App Bridge経由で動作。|
|バックエンド (API)|Cloudflare Workers (JavaScript/TypeScript)|D1とのデータ連携、Shopify API通信を担当。|
|データベース|Cloudflare D1 (SQLite)|バナー設定情報および**利用状況データ**の永続化。|
|ホスティング|Cloudflare Pages (フロントエンド), Cloudflare Workers (バックエンド)||
|認証|Shopify OAuth 2.0, App Bridge Session Token||

### 1.2. システムアーキテクチャ

1. **管理画面 (React/Pages):** マーチャントがバナー設定を行うUI。App Bridgeを通じてShopify管理画面に埋め込まれる。API呼び出しはWorkers経由。
    
2. **Workers API:** Appからの設定保存・取得、およびストアフロントへの表示用JavaScriptを提供するエンドポイント。**課金トラッキングAPI**も含む。
    
3. **D1 Database:** バナーの設定データ（内容、デザイン、表示条件など）を保存する。
    
4. **ストアフロント注入スクリプト:** Workersが提供する軽量なJavaScriptファイル。マーチャントのShopifyストアに注入され、バナー表示時に**利用回数を非同期でWorkersに通知する**。
    

## 2. データモデル (Cloudflare D1 Schema)

主要なテーブルは`banners`、`user_history`、`usage_tracker`の3つとします。

### 2.1. `banners` テーブルスキーマ

バナーの設定情報を保存します。

|フィールド名|データ型|必須/任意|概要|
|---|---|---|---|
|`id`|TEXT|必須|ユニークID (UUID)|
|`shop_id`|TEXT|必須|ShopifyストアID (マーチャント固有)|
|`status`|INTEGER|必須|0: 無効, 1: 有効|
|`content_text`|TEXT|必須|バナーの表示文言|
|`link_url`|TEXT|必須|遷移先URL|
|`style_bg_color`|TEXT|必須|背景色 (#HEX形式)|
|`style_text_color`|TEXT|必須|文字色 (#HEX形式)|
|`style_font_size`|TEXT|任意|フォントサイズ (例: "16px")|
|`show_close_btn`|INTEGER|必須|閉じるボタン表示 (0: 無効, 1: 有効)|
|`start_at`|TEXT|任意|表示開始日時 (ISO 8601)|
|`end_at`|TEXT|任意|表示終了日時 (ISO 8601)|
|`display_frequency`|TEXT|必須|表示頻度 ('always', 'once', 'once_per_day')|
|`is_countdown`|INTEGER|必須|カウントダウンバナー設定 (0: Off, 1: On)|
|`priority`|INTEGER|必須|表示優先度 (複数バナー時のソート用)|
|**`target_type`**|**TEXT**|**必須**|**表示対象パスの判定方法 ('all', 'include', 'exclude')**|
|**`target_paths`**|**TEXT**|**必須**|**対象パスの配列（JSON文字列として保存。例: `["/products/*", "/collections/sale"]`）**|

### 2.2. `user_history` テーブルスキーマ (表示頻度制御用)

`once`や`once_per_day`などの表示頻度設定をユーザー単位で追跡するために利用されます。

|フィールド名|データ型|必須/任意|概要|
|---|---|---|---|
|`id`|TEXT|必須|ユニークID (UUID)|
|`banner_id`|TEXT|必須|参照するバナーID|
|`user_identifier`|TEXT|必須|ユーザー識別子 (IPアドレス, Cookie IDなど)|
|`last_shown_at`|TEXT|必須|最終表示日時 (ISO 8601)|
|`show_count`|INTEGER|必須|表示回数|

### 2.3. `usage_tracker` テーブルスキーマ (月間表示回数トラッキング用 - 更新)

Shopifyの**定額プラン制限**をトラッキングし、プラン制限の超過を判定するために利用されます。

|フィールド名|データ型|必須/任意|概要|
|---|---|---|---|
|`shop_id`|TEXT|必須|ShopifyストアID|
|`current_month`|TEXT|必須|**トラッキング対象月 (YYYY-MM形式)**|
|`display_count`|INTEGER|必須|当月のバナー表示総回数|
|`plan_limit`|INTEGER|必須|**現在のプランの月間制限回数**|
|`is_over_limit`|INTEGER|必須|**制限超過フラグ (0: 正常, 1: 超過)**|

## 3. 主要機能の仕様

### 3.1. 複数バナーの表示ロジック

1. ストアフロント注入スクリプトが、Workers APIの表示エンドポイントからバナーリストを取得。
    
2. **Workers側で利用制限チェックを実行（1,000回超過で表示停止）。**
    
3. **フィルタリング (期間/ステータス):** `start_at` / `end_at` の期間内であり、`status`が有効なバナーのみを選択。
    
4. **ページパス判定 (新規):**
    
    - Workers側で、リクエスト時のURLパスを取得し、`banners`テーブルの`target_type`に基づき、`target_paths`配列と現在のパスを比較する。
        
    - パスの比較には、`*` (アスタリスク) をワイルドカードとしてサポートする（例: `/products/*`）。
        
    - 判定結果に基づき、表示対象外のバナーをリストから除外する。
        
5. **表示頻度判定:** ユーザー識別子（Cookieで保存）と`user_history`テーブルを参照し、`once`や`once_per_day`の条件を満たすか判定。
    
6. **複数パターン処理:**
    
    - **優先度順:** `priority`値が最も高いバナーのみを表示。
        
    - **順番にローテーション/ランダム表示:** フィルタリングされたバナーの中から、設定に基づき1つを選択。
        
7. 選択されたバナーをストアフロントにレンダリングする。
    

### 3.2. カウントダウンバナー (FR-404)

- レンダリング時に、バナーの`end_at`と現在の時刻を比較し、残り時間を計算するJavaScriptロジックを実装。
    
- 残り時間が0になったら、バナーを自動的に非表示にする。
    

### 3.3. プラン管理とトラッキング (Plan Management & Usage Tracking - 更新)

#### 3.3.1. 定額プランの構造

以下のプラン構造に基づき、Shopifyの定額課金（Recurring Application Charge）を実現します。

| プラン名 | 月間表示回数制限 | 月額料金 | 課金方法 | 備考 |
|---------|----------------|---------|---------|------|
| フリープラン | 1,000回まで | $0.00 | 無料 | **Workersがハードストップを適用** |
| ベーシックプラン | 10,000回まで | $9.99 | 定額課金 | 小規模ストア向け |
| プロプラン | 50,000回まで | $29.99 | 定額課金 | 中規模ストア向け |
| エンタープライズプラン | 無制限 | $99.99 | 定額課金 | 大規模ストア向け |


#### 3.3.2. プラン制限超過時の制御 (更新)

1. **ストアフロントの表示停止:**
    
    - **Workersの表示エンドポイント**は、D1の`usage_tracker`を参照し、`display_count`が**現在のプランの制限回数**を超過している場合、バナーデータを返さず、表示を停止する。
        
2. **管理画面のエラー表示と誘導:**
    
    - **管理画面用API**：`GET /api/usage-status/{shop_id}` を実装し、**現在のプラン情報**、**利用状況**、**制限超過ステータス** (`is_over_limit: boolean`) を返す。
        
    - **React (管理画面)** は、このAPIをロード時に呼び出し、`is_over_limit`が`true`の場合、**Polarisの`Banner`コンポーネント**を用いて、目立つ警告メッセージとプランアップグレードボタンを表示する。

#### 3.3.3. プラン管理機能 (新規)

1. **プラン変更API:**
    
    - `POST /api/change-plan/{shop_id}`: プランの変更（アップグレード・ダウングレード）を処理する。
        
    - Shopify Admin APIを使用して、新しいRecurring Application Chargeを作成し、古いプランをキャンセルする。
        
2. **プラン情報表示:**
    
    - `GET /api/plan-info/{shop_id}`: 現在のプラン情報、利用状況、制限までの残り回数を返す。
        
    - 管理画面にプラン情報と利用状況を表示するダッシュボードを実装する。
        

#### 3.3.4. トラッキングAPI (更新)

|エンドポイント|概要|備考|
|---|---|---|
|`POST /api/track-usage/{shop_id}`|ストアフロントからのバナー表示通知を受け取り、D1の`usage_tracker`をインクリメントし、プラン制限チェックを実行する。|非同期処理で実行し、ストアフロントのパフォーマンスに影響を与えないようにする。|
|`GET /api/usage-status/{shop_id}`|現在のプラン情報、利用状況、制限超過ステータスを返す。|管理画面での表示用。|
|`GET /api/plan-info/{shop_id}`|詳細なプラン情報と利用統計を返す。|プラン管理画面用。|
|`POST /api/change-plan/{shop_id}`|プランの変更（アップグレード・ダウングレード）を処理する。|Shopify Admin APIを使用してRecurring Application Chargeを管理。|

#### 3.3.5. プラン管理ロジック (新規)

1. **プラン変更処理:**
    
    - 新しいプランのRecurring Application Chargeを作成
    - 古いプランのRecurring Application Chargeをキャンセル
    - D1の`usage_tracker`テーブルの`plan_limit`を更新
        
2. **月次リセット処理:**
    
    - Workersの**Cron Triggers**で月次処理を実行
    - `usage_tracker`の`display_count`を0にリセット
    - `is_over_limit`フラグを0にリセット
    

## 4. インフラストラクチャの詳細

### 4.1. Shopify Webhook

- アプリのアンインストール時 (`app/uninstalled`) をWebhookで受け取り、D1から該当ストアのデータをすべて削除するロジックをWorkersに実装。
    

### 4.2. ストアフロントへのスクリプト注入

- アプリインストール時にShopify Script Tag APIを利用し、Workersのエンドポイント（例: `/storefront-script/{shop_id}.js`）をストアフロントに注入する。
    
- このJSファイルは、バナーの表示ロジックとレンダリングロジック、**表示完了後のトラッキングAPI呼び出しロジック**を含む。
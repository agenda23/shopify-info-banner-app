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

### 2.3. `usage_tracker` テーブルスキーマ (月間表示回数トラッキング用 - 新規)

Shopifyの**従量課金**をトラッキングし、無料枠の超過を判定するために利用されます。

|フィールド名|データ型|必須/任意|概要|
|---|---|---|---|
|`shop_id`|TEXT|必須|ShopifyストアID|
|`current_month`|TEXT|必須|**課金対象月 (YYYY-MM形式)**|
|`display_count`|INTEGER|必須|当月のバナー表示総回数|
|`last_reported_count`|INTEGER|必須|Shopifyに最終レポートした表示回数|

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
    

### 3.3. 課金ロジックとトラッキング (Billing & Usage Tracking - 更新)

#### 3.3.1. 課金プランの構造

以下のティア構造に基づき、Shopifyの定額課金（Recuring Application Charge）と従量課金（Usage Charge）を組み合わせて実現します。

| 月間表示回数 (ユニット)   | 料金     | 課金方法                | 備考                                                                   |
| --------------- | ------ | ------------------- | -------------------------------------------------------------------- |
| 0 〜 1,000回      | $0.00  | 無料枠                 | **Workersがハードストップを適用**。Shopifyへのレポートは行わない。                           |
| 1,001 〜 50,000回 | $9.99  | 従量課金 (Usage Charge) | 1,001回目から50,000回目までの利用に対し、**単価$0.0002**で請求。最大$9.80（無料枠を超えた49,000回分）。 |
| 50,001回以上       | $49.99 | 従量課金 (Usage Charge) | 50,001回目以降の利用に対し、**単価$0.001**（例）で請求。ただし、月額請求額の**上限を$49.99**に設定。      |


#### 3.3.2. 契約プラン超過時の制御 (新規)

1. **ストアフロントの表示停止:**
    
    - **Workersの表示エンドポイント**は、D1の`usage_tracker`を参照し、`display_count`が**1,000回**(無料プラン時)を超過している場合、バナーデータを返さず、表示を停止する。
        
2. **管理画面のエラー表示と誘導:**
    
    - **管理画面用API**：`GET /api/usage-status/{shop_id}` を実装し、**超過ステータス** (`is_over_limit: boolean`) を返す。
        
    - **React (管理画面)** は、このAPIをロード時に呼び出し、`is_over_limit`が`true`の場合、**Polarisの`Banner`コンポーネント**を用いて、目立つ警告メッセージとアップグレードボタンを表示する。
        

#### 3.3.3. トラッキングAPI

|エンドポイント|概要|備考|
|---|---|---|
|`POST /api/track-usage/{shop_id}`|ストアフロントからのバナー表示通知を受け取り、D1の`usage_tracker`をインクリメントする。|非同期処理で実行し、ストアフロントのパフォーマンスに影響を与えないようにする。|

#### 3.3.4. Shopifyへのレポートロジック (Workers Cron Triggers)

1. **定期実行:** Workersの**Cron Triggers**でレポート処理を定期的に実行する。
    
2. **差分計算:** D1から`display_count`と`last_reported_count`を取得し、その差分（新規利用回数）を計算する。
    
3. **Usage Charge作成:** Shopify Admin APIを使用して、新規利用回数分の`Usage Charge`をShopifyに報告する。
    
4. **レポート回数更新:** 報告後、`usage_tracker`の`last_reported_count`を更新する。
    

## 4. インフラストラクチャの詳細

### 4.1. Shopify Webhook

- アプリのアンインストール時 (`app/uninstalled`) をWebhookで受け取り、D1から該当ストアのデータをすべて削除するロジックをWorkersに実装。
    

### 4.2. ストアフロントへのスクリプト注入

- アプリインストール時にShopify Script Tag APIを利用し、Workersのエンドポイント（例: `/storefront-script/{shop_id}.js`）をストアフロントに注入する。
    
- このJSファイルは、バナーの表示ロジックとレンダリングロジック、**表示完了後のトラッキングAPI呼び出しロジック**を含む。
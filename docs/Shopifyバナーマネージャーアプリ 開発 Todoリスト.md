## フェーズ 1: インフラ・基盤

- [ ] Shopifyパートナーアカウントのセットアップ
    
- [ ] Cloudflare Workers/Pages/D1の環境セットアップと連携設定
    
- [ ] D1データベースに`banners`, `user_history`, `usage_tracker`テーブルのスキーマを適用
    
- [ ] WorkersにShopify OAuth認証処理を実装
    
- [ ] WorkersにApp Bridgeからのリクエスト検証ロジックを実装
    

## フェーズ 2: バナー設定・管理機能

- [ ] WorkersにD1へのCRUD (作成/読み取り/更新/削除) APIを実装
    
- [ ] **Workers API: バナーデータ保存時、`target_type`と`target_paths`のバリデーションロジックを追加**
    
- [ ] React: Polarisを用いて管理画面の基本レイアウトを作成
    
- [ ] React: バナー一覧表示UIとAPI連携を実装
    
- [ ] React: バナー編集フォーム（文言、リンク、色、期間、頻度）を実装
    
- [ ] **React: バナー編集フォームに表示対象ページ設定UI (`target_type`, `target_paths`入力) を実装**
    

## フェーズ 3: ストアフロント表示制御・課金

- [ ] Workers: `GET /storefront-script/{shop_id}.js` エンドポイントを実装
    
- [ ] **Workers: 表示スクリプト内で、無料枠超過チェック（D1 `usage_tracker`参照）を実装し、超過時は表示停止**
    
- [ ] Workers: ストアフロントスクリプト内で、表示条件（期間、頻度、複数パターン）判定ロジックを実装
    
- [ ] **Workers: ストアフロントスクリプト内で、ページパス判定ロジックを実装（ワイルドカード`*`対応）**
    
- [ ] Workers: プラン管理API (`POST /api/track-usage/{shop_id}`) を実装（プラン制限チェック含む）
    
- [ ] Workers: プラン変更API (`POST /api/change-plan/{shop_id}`) を実装（Recurring Application Charge管理）
    
- [ ] Workers: Cron Triggersを利用した月次リセットロジックを実装（display_countとis_over_limitフラグのリセット）
    
- [ ] React: プラン管理画面を実装（現在のプラン情報、利用状況、制限までの残り回数表示）
    
- [ ] React: プラン変更機能を実装（アップグレード・ダウングレードUI）
    
- [ ] React: プラン状況確認API (`GET /api/usage-status/{shop_id}`) を呼び出し、制限超過時に**プランアップグレード誘導アラート**を表示
    

## フェーズ 4: 連携とテスト

- [ ] Workers: Script Tag API経由でストアフロントスクリプトを注入するロジックを実装
    
- [ ] Workers: アプリ削除Webhook処理を実装
    
- [ ] テスト: プラン制限超過時の表示停止・アラート表示テスト
    
- [ ] **テスト: 異なるURLパスにおけるバナーの表示/非表示判定テスト**
    
- [ ] テスト: プラン変更とRecurring Application Chargeの正確性テスト
    
- [ ] デプロイ: Cloudflare Pages/Workersへのデプロイパイプライン構築
    

## フェーズ 5: リリース準備

- [ ] Shopifyパートナー管理画面で定額プラン（フリープラン、ベーシックプラン、プロプラン、エンタープライズプラン）を設定
    
- [ ] アプリ公開申請
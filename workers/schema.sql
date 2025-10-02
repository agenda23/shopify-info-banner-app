-- Shopify バナーマネージャーアプリ データベーススキーマ

-- banners テーブル: バナーの設定情報
CREATE TABLE IF NOT EXISTS banners (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    status INTEGER NOT NULL DEFAULT 1, -- 0: 無効, 1: 有効
    content_text TEXT NOT NULL,
    link_url TEXT NOT NULL,
    style_bg_color TEXT NOT NULL DEFAULT '#000000',
    style_text_color TEXT NOT NULL DEFAULT '#FFFFFF',
    style_font_size TEXT DEFAULT '16px',
    show_close_btn INTEGER NOT NULL DEFAULT 1, -- 0: 無効, 1: 有効
    start_at TEXT, -- ISO 8601形式
    end_at TEXT, -- ISO 8601形式
    display_frequency TEXT NOT NULL DEFAULT 'always', -- 'always', 'once', 'once_per_day'
    is_countdown INTEGER NOT NULL DEFAULT 0, -- 0: Off, 1: On
    priority INTEGER NOT NULL DEFAULT 0,
    target_type TEXT NOT NULL DEFAULT 'all', -- 'all', 'include', 'exclude'
    target_paths TEXT NOT NULL DEFAULT '[]', -- JSON配列
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- user_history テーブル: 表示頻度制御用のユーザー履歴
CREATE TABLE IF NOT EXISTS user_history (
    id TEXT PRIMARY KEY,
    banner_id TEXT NOT NULL,
    user_identifier TEXT NOT NULL, -- IPアドレス、Cookie IDなど
    last_shown_at TEXT NOT NULL, -- ISO 8601形式
    show_count INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (banner_id) REFERENCES banners(id) ON DELETE CASCADE,
    UNIQUE(banner_id, user_identifier)
);

-- usage_tracker テーブル: 月間表示回数トラッキング用
CREATE TABLE IF NOT EXISTS usage_tracker (
    shop_id TEXT NOT NULL,
    current_month TEXT NOT NULL, -- YYYY-MM形式
    display_count INTEGER NOT NULL DEFAULT 0,
    last_reported_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (shop_id, current_month)
);

-- shops テーブル: ストア情報（認証トークン保存用）
CREATE TABLE IF NOT EXISTS shops (
    shop_id TEXT PRIMARY KEY,
    access_token TEXT NOT NULL,
    scope TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_banners_shop_id ON banners(shop_id);
CREATE INDEX IF NOT EXISTS idx_banners_status ON banners(status);
CREATE INDEX IF NOT EXISTS idx_banners_priority ON banners(priority);
CREATE INDEX IF NOT EXISTS idx_user_history_banner_id ON user_history(banner_id);
CREATE INDEX IF NOT EXISTS idx_user_history_user_identifier ON user_history(user_identifier);
CREATE INDEX IF NOT EXISTS idx_usage_tracker_shop_month ON usage_tracker(shop_id, current_month);

-- トリガー: bannersテーブルのupdated_at自動更新
CREATE TRIGGER IF NOT EXISTS update_banners_timestamp 
    AFTER UPDATE ON banners
    FOR EACH ROW
    BEGIN
        UPDATE banners SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

-- トリガー: user_historyテーブルのupdated_at自動更新
CREATE TRIGGER IF NOT EXISTS update_user_history_timestamp 
    AFTER UPDATE ON user_history
    FOR EACH ROW
    BEGIN
        UPDATE user_history SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

-- トリガー: usage_trackerテーブルのupdated_at自動更新
CREATE TRIGGER IF NOT EXISTS update_usage_tracker_timestamp 
    AFTER UPDATE ON usage_tracker
    FOR EACH ROW
    BEGIN
        UPDATE usage_tracker SET updated_at = datetime('now') WHERE shop_id = NEW.shop_id AND current_month = NEW.current_month;
    END;

-- トリガー: shopsテーブルのupdated_at自動更新
CREATE TRIGGER IF NOT EXISTS update_shops_timestamp 
    AFTER UPDATE ON shops
    FOR EACH ROW
    BEGIN
        UPDATE shops SET updated_at = datetime('now') WHERE shop_id = NEW.shop_id;
    END;

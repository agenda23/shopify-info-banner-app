/**
 * Root Component
 * Shopify App Bridge統合とアプリケーションのルートコンポーネント
 */

import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { AppProvider } from '@shopify/polaris';
import { BrowserRouter } from 'react-router-dom';
import { createAppBridge } from './lib/app-bridge';
import '@shopify/polaris/build/esm/styles.css';

export default function App() {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        
        {/* App Bridge Script */}
        <script
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
          data-api-key={process.env.SHOPIFY_API_KEY}
        />
      </head>
      <body>
        <BrowserRouter>
          <AppProvider
            i18n={{
              Polaris: {
                Common: {
                  checkbox: 'チェックボックス',
                  undo: '元に戻す',
                  cancel: 'キャンセル',
                  clear: 'クリア',
                  submit: '送信',
                  close: '閉じる',
                  remove: '削除',
                  search: '検索',
                  save: '保存',
                  edit: '編集',
                  delete: '削除',
                  confirm: '確認',
                  back: '戻る',
                  next: '次へ',
                  previous: '前へ',
                  loading: '読み込み中...',
                  error: 'エラー',
                  success: '成功',
                  warning: '警告',
                  info: '情報',
                },
                Page: {
                  Header: {
                    rollupActions: {
                      actions: 'アクション',
                    },
                  },
                },
                Button: {
                  spinnerAccessibilityLabel: '読み込み中...',
                },
                TextField: {
                  characterCount: '{count}文字',
                },
                Modal: {
                  iFrameTitle: 'body markup',
                },
                Frame: {
                  skipToContent: 'コンテンツにスキップ',
                  navigation: 'ナビゲーション',
                  Navigation: {
                    closeMobileNavigationLabel: 'ナビゲーションを閉じる',
                    openMobileNavigationLabel: 'ナビゲーションを開く',
                  },
                },
                TopBar: {
                  toggleMenuLabel: 'メニューを切り替え',
                  SearchField: {
                    clearButtonLabel: '検索をクリア',
                    search: '検索',
                  },
                },
              },
            }}
          >
            <Outlet />
          </AppProvider>
        </BrowserRouter>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

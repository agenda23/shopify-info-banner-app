/**
 * Shopify App Server Configuration
 * Session Token認証とOAuth 2.0対応
 */

import { shopifyApp } from '@shopify/shopify-app-express';
import { SQLiteSessionStorage } from '@shopify/shopify-app-session-storage-sqlite';
import { restResources } from '@shopify/shopify-api/rest/admin/2024-10';
import { DeliveryMethod } from '@shopify/shopify-api';

// 環境変数の取得
const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_SCOPES, HOST, DATABASE_URL } = process.env;

if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !SHOPIFY_SCOPES || !HOST) {
  throw new Error('Missing required environment variables');
}

// セッションストレージの設定
const sessionStorage = new SQLiteSessionStorage(DATABASE_URL || './database.sqlite');

// Shopify App設定
export const shopify = shopifyApp({
  api: {
    apiKey: SHOPIFY_API_KEY,
    apiSecretKey: SHOPIFY_API_SECRET,
    scopes: SHOPIFY_SCOPES.split(','),
    hostName: HOST.replace(/https?:\/\//, ''),
    hostScheme: HOST.split('://')[0] as 'http' | 'https',
    apiVersion: '2024-10',
    restResources,
    isEmbeddedApp: true,
  },
  auth: {
    path: '/api/auth',
    callbackPath: '/api/auth/callback',
  },
  webhooks: {
    path: '/api/webhooks',
    // 必須Webhookの設定
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/api/webhooks/app/uninstalled',
    },
    APP_SCOPES_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/api/webhooks/app/scopes_update',
    },
    // プライバシー関連Webhook
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/api/webhooks/customers/data_request',
    },
    CUSTOMERS_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/api/webhooks/customers/redact',
    },
    SHOP_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/api/webhooks/shop/redact',
    },
  },
  sessionStorage,
  hooks: {
    afterAuth: async ({ session }) => {
      // 認証後の処理
      console.log('App authenticated for shop:', session.shop);
      
      // 必要に応じてWebhookの登録
      await shopify.registerWebhooks({ session });
    },
  },
});

// 認証ミドルウェアのエクスポート
export const authenticate = shopify.authenticate;

// セッション管理
export const getSession = shopify.session;

// Webhook認証
export const authenticateWebhook = shopify.authenticate.webhook;

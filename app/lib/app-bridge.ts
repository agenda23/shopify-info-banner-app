/**
 * App Bridge Configuration
 * Shopify管理画面への埋め込み対応
 */

import createApp from '@shopify/app-bridge';
import { getSessionToken } from '@shopify/app-bridge/utilities';

// App Bridgeインスタンスの作成
export const createAppBridge = (apiKey: string, host: string) => {
  return createApp({
    apiKey,
    host,
    forceRedirect: true,
  });
};

// Session Token取得のヘルパー関数
export const getAuthenticatedSessionToken = async (app: any) => {
  try {
    const sessionToken = await getSessionToken(app);
    return sessionToken;
  } catch (error) {
    console.error('Failed to get session token:', error);
    throw error;
  }
};

// 認証済みfetchリクエストのヘルパー関数
export const authenticatedFetch = async (app: any, url: string, options: RequestInit = {}) => {
  const sessionToken = await getAuthenticatedSessionToken(app);
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json',
    },
  });
};

// App Bridgeアクションのヘルパー関数
export const createAppBridgeActions = (app: any) => {
  return {
    // トースト通知
    showToast: (message: string, isError: boolean = false) => {
      // App Bridge 2.0のToastアクション
      app.dispatch({
        type: 'APP::TOAST::SHOW',
        payload: {
          message,
          isError,
        },
      });
    },
    
    // ローディング表示
    showLoading: (isLoading: boolean) => {
      app.dispatch({
        type: 'APP::LOADING::SHOW',
        payload: { isLoading },
      });
    },
    
    // リダイレクト
    redirect: (path: string) => {
      app.dispatch({
        type: 'APP::NAVIGATION::REDIRECT',
        payload: { path },
      });
    },
  };
};

/**
 * App Scopes Update Webhook Handler
 * アプリのスコープ更新時の処理
 */

import type { ActionFunctionArgs } from 'react-router';
import { authenticateWebhook } from '~/lib/shopify.server';
import { db } from '~/lib/database.server';

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop, session, payload } = await authenticateWebhook(request);

    if (topic !== 'APP_SCOPES_UPDATE') {
      throw new Response('Invalid webhook topic', { status: 400 });
    }

    console.log(`App scopes updated for shop: ${shop}`);

    // スコープ更新の処理
    await handleScopesUpdate(shop, payload);

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Error handling app scopes update webhook:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

/**
 * スコープ更新の処理
 */
async function handleScopesUpdate(shop: string, payload: any) {
  try {
    const { previous, current } = payload;

    console.log(`Previous scopes: ${previous.join(', ')}`);
    console.log(`Current scopes: ${current.join(', ')}`);

    // ショップ情報のスコープ更新
    await db.shop.update({
      where: { shop_id: shop },
      data: {
        scope: current.join(','),
        updated_at: new Date().toISOString(),
      },
    });

    // スコープ変更に応じた処理
    if (current.includes('write_themes') && !previous.includes('write_themes')) {
      // テーマ書き込み権限が追加された場合の処理
      console.log('Theme write access granted');
    }

    if (!current.includes('write_themes') && previous.includes('write_themes')) {
      // テーマ書き込み権限が削除された場合の処理
      console.log('Theme write access revoked');
    }

    console.log(`Successfully updated scopes for shop: ${shop}`);
  } catch (error) {
    console.error(`Error updating scopes for shop ${shop}:`, error);
    throw error;
  }
}

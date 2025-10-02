/**
 * App Uninstalled Webhook Handler
 * アプリのアンインストール時のクリーンアップ処理
 */

import type { ActionFunctionArgs } from 'react-router';
import { authenticateWebhook } from '~/lib/shopify.server';
import { db } from '~/lib/database.server';

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop, session } = await authenticateWebhook(request);

    if (topic !== 'APP_UNINSTALLED') {
      throw new Response('Invalid webhook topic', { status: 400 });
    }

    console.log(`App uninstalled for shop: ${shop}`);

    // アンインストール時のクリーンアップ処理
    await cleanupShopData(shop);

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Error handling app uninstalled webhook:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

/**
 * ショップデータのクリーンアップ
 */
async function cleanupShopData(shop: string) {
  try {
    // バナーデータの削除
    await db.banner.deleteMany({
      where: { shop_id: shop }
    });

    // ユーザー履歴の削除
    await db.userHistory.deleteMany({
      where: {
        banner: {
          shop_id: shop
        }
      }
    });

    // 利用状況トラッカーの削除
    await db.usageTracker.deleteMany({
      where: { shop_id: shop }
    });

    // ショップ情報の削除
    await db.shop.deleteMany({
      where: { shop_id: shop }
    });

    console.log(`Successfully cleaned up data for shop: ${shop}`);
  } catch (error) {
    console.error(`Error cleaning up data for shop ${shop}:`, error);
    throw error;
  }
}

/**
 * Customers Data Request Webhook Handler
 * GDPR対応：顧客データ要求の処理
 */

import type { ActionFunctionArgs } from 'react-router';
import { authenticateWebhook } from '~/lib/shopify.server';

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop, session, payload } = await authenticateWebhook(request);

    if (topic !== 'CUSTOMERS_DATA_REQUEST') {
      throw new Response('Invalid webhook topic', { status: 400 });
    }

    console.log(`Customer data request received for shop: ${shop}`);

    // 顧客データ要求の処理
    await handleCustomerDataRequest(shop, payload);

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Error handling customer data request webhook:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

/**
 * 顧客データ要求の処理
 */
async function handleCustomerDataRequest(shop: string, payload: any) {
  try {
    const { customer, orders_to_redact } = payload;

    console.log(`Processing data request for customer: ${customer.id}`);

    // 顧客に関連するデータの収集
    const customerData = await collectCustomerData(shop, customer.id);

    // データの提供（実際の実装では、適切な方法で顧客にデータを提供）
    console.log('Customer data collected:', customerData);

    // 注文データの削除対象がある場合
    if (orders_to_redact && orders_to_redact.length > 0) {
      await handleOrderRedaction(shop, orders_to_redact);
    }

    console.log(`Successfully processed data request for customer: ${customer.id}`);
  } catch (error) {
    console.error(`Error processing data request for customer:`, error);
    throw error;
  }
}

/**
 * 顧客データの収集
 */
async function collectCustomerData(shop: string, customerId: string) {
  // 実際の実装では、データベースから顧客に関連するデータを収集
  return {
    shop,
    customerId,
    banners: [], // 顧客に関連するバナーデータ
    usageHistory: [], // 顧客の利用履歴
    // その他の関連データ
  };
}

/**
 * 注文データの削除処理
 */
async function handleOrderRedaction(shop: string, orderIds: string[]) {
  console.log(`Processing order redaction for orders: ${orderIds.join(', ')}`);
  
  // 実際の実装では、指定された注文に関連するデータを削除
  // このアプリでは注文データを直接保存していないため、特別な処理は不要
}

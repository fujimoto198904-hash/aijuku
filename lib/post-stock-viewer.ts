import { getChatGPTUser } from '@/app/chatgpt-auth';
import { listPostStocks } from '@/db/learning-notes';

// Keep the full saved list on the server; each card receives only its own boolean.
export async function getPostStockViewer() {
  const user = await getChatGPTUser();
  const canSave = !!user && !user.isDemo;
  const stocks = canSave ? await listPostStocks(user.userId) : [];
  return { canSave, savedRefs: new Set(stocks.map((stock) => stock.postRef)) };
}

export async function readBoundedJson(
  request: Request,
  maxBytes = 24000,
): Promise<Record<string, unknown>> {
  if (!request.body) throw new Error('入力内容を確認してください。');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error('入力内容が長すぎます。');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new Error('入力内容を確認してください。');
  return data as Record<string, unknown>;
}

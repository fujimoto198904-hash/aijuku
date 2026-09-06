import { communityMediaLimits as limits } from '@/lib/community-media-limits';
import { withSiteBasePath } from '@/lib/site-paths';

export async function preparePostImage(file: File, purpose: 'post' | 'avatar') {
  if (
    file.size > limits.inputMaxBytes ||
    !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
  )
    throw new Error('12MB以下のPNG・JPEG・WebPを選んでください。');
  const bitmap = await createImageBitmap(file);
  let canvas = document.createElement('canvas');
  try {
    const ratio = Math.min(
      1,
      limits.maxEdge / Math.max(bitmap.width, bitmap.height),
    );
    canvas.width =
      purpose === 'avatar'
        ? 512
        : Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height =
      purpose === 'avatar'
        ? 512
        : Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('画像を読み取れませんでした。');
    if (purpose === 'avatar') {
      const side = Math.min(bitmap.width, bitmap.height);
      context.drawImage(
        bitmap,
        (bitmap.width - side) / 2,
        (bitmap.height - side) / 2,
        side,
        side,
        0,
        0,
        512,
        512,
      );
    } else context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (let attempt = 0; attempt < 8; attempt++) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (!blob) throw new Error('画像を読み取れませんでした。');
      if (blob.size <= limits.maxBytes) return blob;
      const scale = Math.min(
        0.85,
        Math.sqrt(limits.maxBytes / blob.size) * 0.9,
      );
      const small = document.createElement('canvas');
      small.width = Math.max(1, Math.floor(canvas.width * scale));
      small.height = Math.max(1, Math.floor(canvas.height * scale));
      const smallContext = small.getContext('2d');
      if (!smallContext) throw new Error('画像を読み取れませんでした。');
      smallContext.drawImage(canvas, 0, 0, small.width, small.height);
      canvas.width = canvas.height = 0;
      canvas = small;
    }
    throw new Error('画像を小さくできませんでした。別の画像をお試しください。');
  } finally {
    bitmap.close();
    canvas.width = canvas.height = 0;
  }
}

export async function uploadPostImage(blob: Blob): Promise<string> {
  const response = await fetch(withSiteBasePath('/api/community/media'), {
    method: 'POST',
    headers: { 'Content-Type': 'image/png' },
    body: blob,
  });
  const data = (await response.json()) as { id?: string; error?: string };
  if (!response.ok || !data.id)
    throw new Error(data.error || '画像を追加できませんでした。');
  return data.id;
}

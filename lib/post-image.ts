const signature = [137, 80, 78, 71, 13, 10, 26, 10];
function crc32(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (const b of bytes) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}
export async function cleanPostPng(bytes: Uint8Array) {
  if (bytes.length > 1500000 || !signature.every((v, i) => bytes[i] === v))
    throw Error('PNG画像を選んでください。');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let pos = 8,
    width = 0,
    height = 0,
    channels = 4,
    end = false,
    idatEnded = false;
  const parts = [bytes.slice(0, 8)],
    compressed: Uint8Array[] = [];
  while (pos + 12 <= bytes.length) {
    const length = view.getUint32(pos);
    if (length > 1500000 || pos + 12 + length > bytes.length)
      throw Error('画像を読み取れません。');
    const type = String.fromCharCode(...bytes.slice(pos + 4, pos + 8));
    const chunk = bytes.slice(pos, pos + 12 + length);
    if (crc32(chunk.slice(4, -4)) !== view.getUint32(pos + 8 + length))
      throw Error('画像のデータが壊れています。');
    if (pos === 8 && type !== 'IHDR')
      throw Error('画像の形式を確認してください。');
    if (type === 'IHDR') {
      if (pos !== 8 || length !== 13)
        throw Error('画像の形式を確認してください。');
      width = view.getUint32(pos + 8);
      height = view.getUint32(pos + 12);
      channels = bytes[pos + 17] === 2 ? 3 : 4;
      if (
        width < 1 ||
        height < 1 ||
        width > 1600 ||
        height > 1600 ||
        bytes[pos + 16] !== 8 ||
        ![2, 6].includes(bytes[pos + 17]) ||
        bytes[pos + 18] !== 0 ||
        bytes[pos + 19] !== 0 ||
        bytes[pos + 20] !== 0
      )
        throw Error('画像を選び直してください。');
      parts.push(chunk);
    } else if (type === 'IDAT') {
      if (idatEnded) throw Error('画像の形式を確認してください。');
      compressed.push(chunk.slice(8, -4));
      parts.push(chunk);
    } else if (type === 'IEND') {
      if (length || !compressed.length || pos + 12 !== bytes.length)
        throw Error('画像の形式を確認してください。');
      parts.push(chunk);
      end = true;
      break;
    } else {
      if (compressed.length) idatEnded = true;
      if (type.charCodeAt(0) < 97)
        throw Error('この画像の形式には対応していません。');
      // Drop all ancillary chunks, including EXIF, text, ICC and location metadata.
    }
    pos += length + 12;
  }
  if (!end) throw Error('画像を読み取れません。');
  const compressedBytes = new Uint8Array(
    compressed.reduce((n, b) => n + b.length, 0),
  );
  let offset = 0;
  for (const b of compressed) {
    compressedBytes.set(b, offset);
    offset += b.length;
  }
  const stream = new Blob([compressedBytes])
    .stream()
    .pipeThrough(new DecompressionStream('deflate'));
  const reader = stream.getReader();
  let decoded = 0;
  const expected = (width * channels + 1) * height;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      decoded += value.length;
      if (decoded > expected) throw Error('画像が大きすぎます。');
    }
  } finally {
    await reader.cancel();
  }
  if (decoded !== expected) throw Error('画像を読み取れません。');
  const output = new Uint8Array(parts.reduce((n, b) => n + b.length, 0));
  offset = 0;
  for (const p of parts) {
    output.set(p, offset);
    offset += p.length;
  }
  return { bytes: output, width, height };
}

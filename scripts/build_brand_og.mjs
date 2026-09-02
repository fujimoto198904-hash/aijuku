import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const outputPath = resolve(
  projectRoot,
  "public/brand/fujimoto-jitsugaku-og-1200x630.png",
);

const svg = String.raw`
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FBFAF6"/>
      <stop offset="1" stop-color="#EAEFEA"/>
    </linearGradient>
    <linearGradient id="navy" x1="80" y1="40" x2="790" y2="590" gradientUnits="userSpaceOnUse">
      <stop stop-color="#102A36"/>
      <stop offset="1" stop-color="#183E4B"/>
    </linearGradient>
    <linearGradient id="wing" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop stop-color="#2D746F"/>
      <stop offset="1" stop-color="#80B8A7"/>
    </linearGradient>
    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="24"/>
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#paper)"/>
  <circle cx="1042" cy="118" r="164" fill="#DCEDE6" opacity="0.72" filter="url(#softGlow)"/>
  <circle cx="1015" cy="520" r="128" fill="#F2D9CF" opacity="0.56" filter="url(#softGlow)"/>
  <path d="M0 0H786C826 0 850 24 850 64V566C850 606 826 630 786 630H0V0Z" fill="url(#navy)"/>
  <path d="M0 534C203 500 352 524 493 566C622 605 708 603 850 559V630H0V534Z" fill="#0B202A" opacity="0.4"/>

  <text x="72" y="82" fill="#B9D9CF" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="4">FUJIMOTO JITSUGAKU JUKU</text>
  <rect x="72" y="112" width="72" height="4" rx="2" fill="#A94B3A"/>
  <text x="72" y="216" fill="#FFFFFF" font-family="Hiragino Mincho ProN, Yu Mincho, Noto Serif JP, serif" font-size="63" font-weight="600" letter-spacing="2">AIを、すべての人の</text>
  <text x="72" y="302" fill="#FFFFFF" font-family="Hiragino Mincho ProN, Yu Mincho, Noto Serif JP, serif" font-size="76" font-weight="700" letter-spacing="3">実学へ。</text>
  <text x="75" y="370" fill="#D6E5E1" font-family="Hiragino Sans, Yu Gothic, Noto Sans JP, sans-serif" font-size="26" font-weight="500" letter-spacing="1">暮らしと仕事で使えるものを、一つずつ。</text>

  <rect x="72" y="440" width="357" height="66" rx="33" fill="#F7F4ED"/>
  <text x="105" y="482" fill="#102A36" font-family="Hiragino Sans, Yu Gothic, Noto Sans JP, sans-serif" font-size="22" font-weight="700">Web教科書は登録なしで無料</text>

  <g transform="translate(905 126) scale(3.7)">
    <path d="M30.5 52C24.8 46.3 18.6 43 10.3 44.1c-4-3-4.1-8.2-.1-12.7-3-4.3-2.4-11.3.9-16.3 9.6.3 16.3 6 19.4 15.6V52Z" fill="url(#wing)"/>
    <path d="M30.5 52C24.8 46.3 18.6 43 10.3 44.1c-4-3-4.1-8.2-.1-12.7-3-4.3-2.4-11.3.9-16.3 9.6.3 16.3 6 19.4 15.6V52Z" fill="url(#wing)" transform="matrix(-1 0 0 1 64 0)"/>
    <path d="M32 16 35 24l-1.8 25.5L32 54l-1.2-4.5L29 24l3-8Z" fill="#A94B3A"/>
  </g>
  <text x="928" y="408" fill="#102A36" font-family="Hiragino Mincho ProN, Yu Mincho, Noto Serif JP, serif" font-size="33" font-weight="700" letter-spacing="2">藤本実学塾</text>
  <text x="931" y="448" fill="#48616B" font-family="Hiragino Sans, Yu Gothic, Noto Sans JP, sans-serif" font-size="16" font-weight="600" letter-spacing="2">学ぶ・試す・持ち帰る</text>
  <path d="M931 478H1112" stroke="#A94B3A" stroke-width="3" stroke-linecap="round"/>
</svg>`;

await mkdir(dirname(outputPath), { recursive: true });
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outputPath);
console.log(outputPath);

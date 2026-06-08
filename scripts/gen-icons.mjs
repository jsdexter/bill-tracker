import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('public', { recursive: true });

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" rx="80" fill="#7c6af5"/>
  <text x="256" y="320" font-size="240" text-anchor="middle" fill="white">📋</text>
</svg>`);

await sharp(svg).resize(512, 512).png().toFile('public/icon-512.png');
await sharp(svg).resize(192, 192).png().toFile('public/icon-192.png');
console.log('Icons generated.');

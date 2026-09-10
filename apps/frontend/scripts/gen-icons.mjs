/**
 * Rasterizes public/champey-mark.svg (the C + plumeria brand mark) into the
 * PWA icon set: public/icon-192.png and public/icon-512.png.
 *
 * Usage: node scripts/gen-icons.mjs   (from apps/frontend)
 * Requires the sharp dev dependency (already in the frontend node_modules).
 */
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const svg = await readFile(new URL("../public/champey-mark.svg", import.meta.url));

// The mark is drawn edge-to-edge; PWA icons read better with a small inset
// so the round-capped C never touches the mask edge on Android/launchers.
async function renderPng(size, inset) {
  const inner = size - inset * 2;
  const icon = await sharp(svg, { density: 384 })
    .resize(inner, inner)
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0x0a, g: 0x0a, b: 0x0c, alpha: 1 },
    },
  })
    .composite([{ input: icon, top: inset, left: inset }])
    .png()
    .toBuffer()
    .then((buf) =>
      writeFile(new URL(`../public/icon-${size}.png`, import.meta.url), buf)
    );
  console.log(`icon-${size}.png written`);
}

await renderPng(192, 12);
await renderPng(512, 32);

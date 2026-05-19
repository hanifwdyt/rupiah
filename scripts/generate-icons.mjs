// Generates PWA PNG icons from public/icon.svg
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const svgPath = path.join(root, "public", "icon.svg");
const svg = fs.readFileSync(svgPath);

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-icon.png", size: 180 },
];

for (const { name, size } of sizes) {
  await sharp(svg, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(path.join(root, "public", name));
  console.log(`wrote public/${name}`);
}

// Maskable: padded background (safe zone ~80% of frame)
const maskableSize = 512;
const inner = Math.round(maskableSize * 0.7);
const pad = Math.round((maskableSize - inner) / 2);
const inner_buffer = await sharp(svg, { density: 300 }).resize(inner, inner).png().toBuffer();
await sharp({
  create: { width: maskableSize, height: maskableSize, channels: 4, background: "#F2EDE3" },
})
  .composite([{ input: inner_buffer, top: pad, left: pad }])
  .png()
  .toFile(path.join(root, "public", "icon-512-maskable.png"));
console.log("wrote public/icon-512-maskable.png");

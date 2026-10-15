import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const source = await readFile(new URL("../app/icon.svg", import.meta.url));
const sizes = [16, 32, 48, 64, 256];
const images = await Promise.all(sizes.map(size => sharp(source).resize(size, size).png().toBuffer()));
// ICO directory entries point to lossless PNG frames at each native tab size.
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
images.forEach((bytes, index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index] === 256 ? 0 : sizes[index];
  header[entry + 1] = header[entry];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(bytes.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += bytes.length;
});
await writeFile(new URL("../app/favicon.ico", import.meta.url), Buffer.concat([header, ...images]));
await sharp(source).resize(180, 180).png().toFile(fileURLToPath(new URL("../app/apple-icon.png", import.meta.url)));
await writeFile(new URL("../public/branding/favicon-preview.png", import.meta.url), images.at(-1));
console.log("Generated multi-size favicon, Apple touch icon and preview from app/icon.svg.");

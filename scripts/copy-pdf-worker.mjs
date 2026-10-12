import { copyFileSync, cpSync, mkdirSync, readFileSync } from "node:fs";
const { version } = JSON.parse(readFileSync("node_modules/pdfjs-dist/package.json", "utf8"));
mkdirSync("public/pdfjs", { recursive: true });
copyFileSync("node_modules/pdfjs-dist/build/pdf.worker.min.mjs", `public/pdfjs/pdf.worker-${version}.min.mjs`);
copyFileSync("node_modules/pdfjs-dist/LICENSE", "public/pdfjs/LICENSE");
for (const directory of ["cmaps", "standard_fonts", "wasm", "iccs"]) cpSync(`node_modules/pdfjs-dist/${directory}`, `public/pdfjs/${version}/${directory}`, { recursive: true });

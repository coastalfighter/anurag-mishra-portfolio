// Copies the Draco + Basis (KTX2) decoders shipped with three.js into /public so
// compressed glTF models and KTX2 textures decode from our own origin (CSP-safe,
// no CDN dependency). Runs automatically on `npm install` (postinstall).
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const libs = join(root, "node_modules", "three", "examples", "jsm", "libs");

const targets = [
  { from: join(libs, "draco", "gltf"), to: join(root, "public", "decoders", "draco") },
  { from: join(libs, "basis"), to: join(root, "public", "decoders", "basis") },
];

for (const { from, to } of targets) {
  if (!existsSync(from)) {
    console.warn(`[copy-decoders] skipped, not found: ${from}`);
    continue;
  }
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true, filter: (src) => !src.endsWith("README.md") });
  console.log(`[copy-decoders] ${from} -> ${to}`);
}

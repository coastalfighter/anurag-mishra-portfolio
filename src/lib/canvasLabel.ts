import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";

export interface LabelLine {
  text: string;
  /** px size at the texture's resolution */
  size: number;
  weight?: number | string;
  color?: string;
  /** "display" → Chivo, "body" → Abel (resolved from next/font CSS variables). */
  family?: "display" | "body";
  letterSpacing?: number;
  /** Extra space above this line in px. */
  gap?: number;
  /** Wrap long text to the label width. */
  wrap?: boolean;
}

export interface LabelOptions {
  width: number;
  height: number;
  lines: LabelLine[];
  padding?: number;
  background?: string;
  border?: string;
  accentBar?: string;
  align?: "left" | "center";
}

function resolveFamily(kind: "display" | "body"): string {
  if (typeof document === "undefined") return "sans-serif";
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(kind === "display" ? "--font-chivo" : "--font-abel")
    .trim();
  return v ? `${v}, sans-serif` : "sans-serif";
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Renders crisp typographic plaques to a CanvasTexture. Used for 3D panels
 * (career corridor, award crown) so no font files need to be fetched by WebGL.
 */
export function makeLabelTexture(opts: LabelOptions): CanvasTexture {
  const { width, height, lines, padding = 48, background = "rgba(36,20,78,0.94)", border, accentBar, align = "left" } = opts;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width - 4, height - 4);
  }
  if (accentBar) {
    ctx.fillStyle = accentBar;
    ctx.fillRect(padding, padding - 18, 64, 6);
  }

  let y = padding + (accentBar ? 16 : 0);
  ctx.textBaseline = "top";
  ctx.textAlign = align;
  const x = align === "center" ? width / 2 : padding;
  for (const line of lines) {
    y += line.gap ?? 0;
    ctx.font = `${line.weight ?? 400} ${line.size}px ${resolveFamily(line.family ?? "display")}`;
    ctx.fillStyle = line.color ?? "#f2f2ef";
    if ("letterSpacing" in ctx) {
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${line.letterSpacing ?? 0}px`;
    }
    const rows = line.wrap ? wrapText(ctx, line.text, width - padding * 2) : [line.text];
    for (const row of rows) {
      ctx.fillText(row, x, y);
      y += line.size * 1.22;
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = 4;
  return texture;
}

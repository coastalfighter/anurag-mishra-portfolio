import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy.
 * - 'wasm-unsafe-eval' lets the Draco / Basis decoders compile WebAssembly.
 * - blob: workers are used by the three.js decoders.
 * - Case-study films are embedded from Vimeo and YouTube (privacy-enhanced domain).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  "connect-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "frame-src https://player.vimeo.com https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' mailto:",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

/** Legacy Squarespace URLs → new case-study routes (keeps inbound links & SEO alive). */
const legacyWorkSlugs: Record<string, string> = {
  cadbury: "cadbury",
  croma: "croma",
  "shutterstock-a-selling-hashtag": "shutterstock-a-selling-hashtag",
  zomato: "zomato",
  "hyundai-brilliant-moments": "hyundai-brilliant-moments",
  "mercedes-benz": "mercedes-benz",
  pagep: "paytm-pollution-tax",
  "kia-motors-two-little-feet": "kia-motors-two-little-feet",
  "asos-wardrobe": "asos-wardrobe",
  "listerine-ask-yourself-why": "listerine-ask-yourself-why",
  "hyundai-introducing-the-clutch": "hyundai-introducing-the-clutch",
  "facebook-friend-request-fentanyl": "facebook-friend-request-fentanyl",
  "nike-victory-smile": "nike-victory-smile",
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Not content-hashed (so assets can be swapped in place) → cache a day, revalidate in background.
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        source: "/decoders/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  async redirects() {
    return [
      ...Object.entries(legacyWorkSlugs).map(([from, to]) => ({
        source: `/${from}`,
        destination: `/work/${to}`,
        permanent: true,
      })),
      { source: "/about", destination: "/#about", permanent: true },
      { source: "/resume", destination: "/#experience", permanent: true },
    ];
  },
};

export default nextConfig;

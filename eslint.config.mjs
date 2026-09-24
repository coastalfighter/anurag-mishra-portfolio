import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [".next/**", "node_modules/**", "public/decoders/**", "coverage/**", "next-env.d.ts"],
  },
  {
    rules: {
      // R3F idiom: mutating three.js objects (uniforms, positions) inside useFrame is expected.
      "react-hooks/immutability": "off",
    },
  },
];

export default config;

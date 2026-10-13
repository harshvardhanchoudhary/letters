import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "backups/**",
      "playwright-report/**",
      "test-results/**",
      "import-letters.js",
    ],
  },
];

export default config;

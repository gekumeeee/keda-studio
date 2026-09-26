import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      // Plain <img> on purpose. The images here are the brand SVGs and
      // user-supplied external URLs (uploads on jsDelivr, client logos on
      // their own sites); next/image would send every one of them through
      // Vercel's image optimizer, which is metered — and the site is kept to
      // free usage only.
      "@next/next/no-img-element": "off",
      // A Pages Router rule (it wants fonts in pages/_document.js). Here the
      // font <link> sits in the App Router's root layout, which every page
      // shares — exactly what the rule is asking for.
      "@next/next/no-page-custom-font": "off",
    },
  },
  {
    // These are @react-pdf/renderer <Image> elements, drawn into a PDF, not
    // HTML — they have no alt attribute to give.
    files: ["lib/pdfTemplates.js"],
    rules: { "jsx-a11y/alt-text": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

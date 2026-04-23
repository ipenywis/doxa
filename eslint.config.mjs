import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  {
    ignores: [
      "build/",
      "coverage/",
      "dist/",
      ".next/",
      ".output/",
      ".tanstack/",
      ".vercel/",
      ".vinxi/",
      ".vite/",
      ".wrangler/",
      "public/search-data/",
      "src/routeTree.gen.ts",
      "*.tsbuildinfo",
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  tseslint.configs.stylistic,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
  },
]);

export default eslintConfig;

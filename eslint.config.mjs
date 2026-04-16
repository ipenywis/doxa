import eslint from "@eslint/js"
import tsParser from "@typescript-eslint/parser"
import { defineConfig } from "eslint/config"
import tseslint from "typescript-eslint"

const eslintConfig = defineConfig([
  eslint.configs.recommended,
  tseslint.configs.recommended,
  tseslint.configs.stylistic,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          ecmaVersion: "latest",
          jsx: true,
        },
        projectService: true,
      },
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
  },
  {
    ignores: ["dist/", ".vite/", ".vinxi/", ".output/", ".next/"],
  },
])

export default eslintConfig

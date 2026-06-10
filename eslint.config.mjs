import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "apps/miniapp/src/uni_modules/**",
      "apps/miniapp/dist/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs["flat/recommended"],
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        console: "readonly",
        fetch: "readonly"
      }
    },
    rules: {
      "no-redeclare": "off"
    }
  },
  {
    files: ["scripts/sync-sensitive-lexicon.mjs", "scripts/verify-low-cost-content-moderation.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        Buffer: "readonly",
        console: "readonly",
        fetch: "readonly"
      }
    }
  },
  {
    files: ["scripts/generate-miniapp-icon-v2-preview.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly"
      }
    }
  },
  {
    files: ["**/*.{ts,vue}"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        uni: "readonly",
        getApp: "readonly"
      }
    },
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/max-attributes-per-line": "off",
      "vue/html-self-closing": [
        "warn",
        {
          html: {
            void: "always",
            normal: "always",
            component: "always"
          },
          svg: "always",
          math: "always"
        }
      ],
      "vue/singleline-html-element-content-newline": "off",
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];

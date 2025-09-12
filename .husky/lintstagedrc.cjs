/**
 * Lint-staged configuration file for pre-commit hooks
 *
 * This configuration file defines the commands that will be executed
 * on staged files before a Git commit is made. It uses lint-staged
 * to run linting and formatting tools on specific file patterns.
 */

module.exports = {
  // Run ESLint and Prettier on JavaScript/TypeScript files in src directory
  // ESLint will automatically use the configuration from eslint.config.mjs
  "src/**/*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],

  // Run Prettier on all Markdown files
  "**/*.md": ["prettier --write"],

  // Run Prettier on package.json file
  "package.json": ["prettier --write"],

  // Run Prettier with JSON parser on JSON files (excluding package.json)
  "!(package)*.json": ["prettier --write --parser json"]
};

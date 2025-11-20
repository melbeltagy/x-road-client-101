module.exports = {
  // TypeScript/TSX files: ESLint, type checking, and Prettier
  '{,src/main/webapp/**/}*.{ts,tsx}': ['eslint --fix --max-warnings=0', () => 'tsc --noEmit --project tsconfig.json', 'prettier --write'],

  // JavaScript files: ESLint and Prettier
  '{,**/}*.{js,cjs,mjs}': ['eslint --fix --max-warnings=0', 'prettier --write'],

  // Java files: Checkstyle and Prettier
  '{,src/main/**/,src/test/**/}*.java': [() => './gradlew checkstyleMain checkstyleTest --console=plain', 'prettier --write'],

  // SCSS/CSS files: Prettier only (CSS linting would require stylelint)
  '{,src/main/webapp/**/}*.{css,scss}': ['prettier --write'],

  // Other files: Prettier only
  '{,**/}*.{md,json,yml,html}': ['prettier --write'],
};

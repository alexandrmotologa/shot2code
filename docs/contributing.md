# Contributing to Shot2Code

We welcome contributions to Shot2Code. You can contribute by fixing bugs, improving heuristics, adding language detection signatures, or refining documentation.

## Development Workflow

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/alexandrmotologa/shot2code.git
   cd shot2code
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Run tests continuously while writing code:
   ```bash
   npm run test:watch
   ```

## Code Guidelines

- **TypeScript:** Strict mode is enabled. All exported interfaces and engine functions must include clear type definitions. Avoid `any`.
- **Heuristics Tests:** If you add new regex replacements or OCR glyph fixes, you must add corresponding test cases in `src/engine/__tests__/codeHeuristics.test.ts`.
- **Formatting:** Keep code clean and readable. Use standard 2-space indentation.
- **Prose Standards:** Follow the humanizer guidelines for documentation and commit messages. Avoid marketing superlatives, AI clichés, and em dashes.

## Submitting Pull Requests

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes following conventional commit syntax:
   ```bash
   git commit -m "feat(engine): add indentation recovery for Ruby end blocks"
   ```
3. Verify that tests pass and the production build compiles:
   ```bash
   npm test
   npm run build
   ```
4. Push your branch and open a Pull Request against `main`.

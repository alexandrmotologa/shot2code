# Shot2Code

Shot2Code is a desktop and in-browser developer utility that captures code snippets from video tutorials, conference livestreams, webinars, PDFs, and screenshots where text selection is disabled. It extracts code using a WebAssembly-powered OCR worker, repairs broken indentation, cleans common OCR character glitches, and formats the code for your editor.

![Shot2Code Studio](public/logo.svg)

## Capabilities

- **In-browser and desktop capture:** Run directly in any modern browser via the HTML5 Screen Capture API (`getDisplayMedia`) or as a native desktop utility via Tauri 2.0.
- **Direct clipboard image paste:** Press `Ctrl+V` (or `Cmd+V`) anywhere in the application to parse screenshots taken with the Windows Snipping Tool (`Win+Shift+S`) or macOS screenshot shortcuts without saving intermediate image files.
- **IDE theme preprocessor:** Detects dark theme backgrounds, inverts pixel values to dark text on pure white for higher recognition accuracy, applies contrast filters, and scales images by 2x to preserve colons, semicolons, and subtle punctuation.
- **Gutter line number and prompt stripper:** Detects and strips IDE line number columns (`1 |`, `02:`, `15 `) and shell prompts (`$ `, `>>> `, `> `) without shifting line indentation.
- **Syntactic indentation reconstructor:** Rebuilds space and tab hierarchies based on block scope markers, curly braces, and language keywords.
- **Ambiguity lens:** Scans output for low-confidence or confused characters (such as `|` vs `l`, `0` in variable names, and unclosed delimiters) and provides one-click corrections.
- **In-browser code formatter:** Standardizes indentation (2 vs 4 spaces), operator spacing, and identifier casing (`camelCase`, `snake_case`, `PascalCase`, `CONSTANT_CASE`).
- **Multi-snippet workspace:** Organize captures across parallel tabs and merge them into a single documented source file with one click.
- **Presentation exports:** Open snippets directly in Ray.so or Carbon, or publish anonymous GitHub Gists.
- **Optional AI syntax polish:** Client-side BYOK integration supporting Gemini 1.5 Flash, OpenAI, Claude, or local Ollama instances for low-resolution 720p video screenshots.
- **Zero server dependencies:** The core OCR engine runs entirely client-side using Tesseract WebAssembly. Your screenshots and code never leave your machine.

## Supported Languages

Shot2Code includes automated syntax detection and highlighting for:

| Language | File Extension | Syntax Highlighting |
| :--- | :--- | :--- |
| Python | `.py` | Yes |
| TypeScript | `.ts` | Yes |
| JavaScript | `.js` | Yes |
| Rust | `.rs` | Yes |
| Go | `.go` | Yes |
| SQL | `.sql` | Yes |
| HTML | `.html` | Yes |
| CSS | `.css` | Yes |
| C++ | `.cpp` | Yes |
| Shell / Bash | `.sh` | Yes |
| JSON | `.json` | Yes |

## Quick Start

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Installation

```bash
git clone https://github.com/alexandrmotologa/shot2code.git
cd shot2code
npm install
```

### Development Server

Start the local web studio:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### Run Unit Tests

Execute the Vitest test suite covering the heuristics engine, ambiguity detector, and language scorer:

```bash
npm test
```

### Production Build

Compile the application bundle:

```bash
npm run build
```

The output files are generated in the `dist/` directory.

## Desktop Shell (Tauri 2.0)

To build the native desktop application with global system shortcuts:

```bash
# Prerequisites: Rust toolchain installed (https://rustup.rs)
npm install -g @tauri-apps/cli
cargo tauri dev
```

## Documentation

- [Architecture Overview](docs/architecture.md): WebAssembly OCR workers, canvas filters, and state pipelines.
- [Heuristics Guide](docs/heuristics-guide.md): Indentation reconstruction, delimiter balancing, and symbol disambiguation tables.
- [Tauri Setup Guide](docs/tauri-setup.md): Native desktop configuration, global hotkeys, and release builds.
- [Contributing](docs/contributing.md): Contribution workflow and coding conventions.

## License

MIT License. Copyright (c) 2026 alexandrmotologa.

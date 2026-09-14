# Architecture Overview

Shot2Code operates as a hybrid desktop and in-browser system. It processes screenshots locally using HTML5 canvas filters, WebAssembly neural OCR workers, and language-specific AST heuristics.

## System Topology

```
[Screen Capture / Clipboard / File Drop]
                   │
                   ▼
       [HTML5 Canvas Preprocessor]
  (Bicubic 2x Upscale, Theme Inversion)
                   │
                   ▼
       [Tesseract WASM Worker]
    (Page Seg Mode 6, Code Whitelist)
                   │
                   ▼
       [Code Heuristics Pipeline]
   (Gutter Stripping, Indent Tree)
                   │
                   ▼
       [Language Detection Engine]
                   │
                   ▼
      [Diff & Ambiguity Inspector]
   (Split View, 1-Click Glitch Fixes)
```

## Image Preprocessor (`src/engine/preprocessor.ts`)

Standard OCR models struggle with dark theme IDE screenshots because they are trained on black text on white paper. The preprocessor normalizes input before recognition:

1. **Background Luminance Analysis:** Samples perimeter pixels to determine background brightness. If average luminance is below 0.5, the image is classified as dark mode.
2. **Theme Inversion:** Inverts dark backgrounds to pure white (`#ffffff`) and bright colored text to high-contrast dark tones.
3. **Bicubic Upscaling:** Scales the canvas by a factor of 2.0. This prevents small punctuation marks (such as colons, semicolons, and commas) from eroding during thresholding.
4. **Contrast Adjustment:** Applies linear contrast expansion to eliminate ringing artifacts from JPEG and video compression.

## WebAssembly OCR Worker (`src/engine/ocrWorker.ts`)

The recognition layer uses Tesseract.js running in a dedicated Web Worker:

- **Page Segmentation Mode 6 (PSM 6):** Enforces single uniform text block assumptions, preventing the engine from splitting code columns into separate paragraphs.
- **Character Whitelist:** Restricts character recognition to ASCII alphanumeric symbols, programming operators (`{}[]()<>:;.,=+-*/%&|^!~?'"`), whitespace, and common scripting prefixes (`#`, `$`, `@`).
- **Memory Management:** Keeps a reusable worker instance alive across operations to avoid recurring WebAssembly initialization latency.

## Heuristics Engine (`src/engine/codeHeuristics.ts`)

Raw OCR output from code screenshots contains typical systemic flaws:

1. **Line Number Gutters:** Detects monotonic prefixes (such as `1 |`, `02:`, or `14  `) on multiple consecutive lines and removes them cleanly.
2. **Interactive Prompts:** Removes shell prompts (`$ `, `>>> `, `> `, `» `) without altering user-written commands.
3. **Symbol Disambiguation:** Resolves typical optical confusions based on programming keyword syntax (such as `c0nst` -> `const`, or pipe symbols mistaken for `l`).
4. **Indentation Tree Reconstruction:** When leading whitespace is flattened by OCR, the engine walks opening braces (`{`, `(`, `[`) and colon terminators (`def:`, `if:`) to reconstruct a nested indentation tree.

## Ambiguity Lens (`src/engine/ambiguityDetector.ts`)

Scans post-processed code for potential OCR artifacts:

- **Unbalanced Delimiters:** Tracks bracket stacks to detect missing closing parentheses or braces.
- **Suspicious Tokens:** Flags digit `0` inside variable names or pipe characters at the start of keywords.
- **Unicode Artifacts:** Detects non-ASCII copyright or currency signs that result from video compression noise.

## Client-Side AI Polish (`src/engine/aiPolish.ts`)

Users can optionally connect their own API key (Gemini, OpenAI, Claude, or local Ollama). The module sends the raw extracted text with a strict system prompt that repairs broken punctuation without conversational commentary.

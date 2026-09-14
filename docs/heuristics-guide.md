# Code Heuristics and Sanitization Guide

This document describes the algorithms used by Shot2Code to convert noisy OCR text into structured code.

## Line Number Gutter Detection

Video recordings of code editors usually show line numbers in the margin. The OCR engine often captures these numbers alongside source code.

### Pattern Classes

The heuristic tests for three formats:

1. **Pipe-separated:** `^\s*(\d{1,4})\s*\|\s?`
   Example: `1 | import React from 'react';` -> `import React from 'react';`
2. **Colon-separated:** `^\s*(\d{1,4})\s*:\s?`
   Example: `01: def calculate_metrics():` -> `def calculate_metrics():`
3. **Space-separated digits:** `^\s*(\d{1,4})\s{2,}`
   Example: `12    return total` -> `return total`

### Decision Threshold

The engine strips gutters only if at least 45% of non-empty lines match one of the pattern formats. This prevents accidental stripping when a line begins with a numeric constant.

## Prompt Stripping

Interactive shell prompts are removed from line starts:

| Original Prefix | Pattern | Replacement |
| :--- | :--- | :--- |
| `$ npm install` | `^(\s*)[$#>»]\s+` | `npm install` |
| `>>> import math` | `^(\s*)>>>\s*` | `import math` |
| `... math.sqrt(4)` | `^(\s*)\.\.\.\s*` | `math.sqrt(4)` |
| `In [1]: df.head()` | `^(\s*)In \[\d+\]:\s*` | `df.head()` |

## Glyph Disambiguation Tables

Monospace fonts can cause ambiguous character representations. The engine repairs known optical confusion patterns when surrounded by programming context:

```
c0nst          -> const
comst          -> const
functi0n       -> function
|et            -> let
!et            -> let
|mport         -> import
impor7         -> import
re7urn         -> return
strüct         -> struct
SE1ECT         -> SELECT
FR0M           -> FROM
WH3RE          -> WHERE
```

### Operator Normalization

```
= >            -> =>
- >            -> ->
< =            -> <=
> =            -> >=
! =            -> !=
= = =          -> ===
= =            -> ==
```

### Typographic Quote Normalization

Smart or curly quotes cause immediate syntax errors in most compilers. All instances of typographic quotation marks are normalized:

- `“`, `”`, `„`, `‟`, `«`, `»` are replaced with standard ASCII `"`
- `‘`, `’`, `‚`, `‛` are replaced with standard ASCII `'`
- Smart dashes (`—`, `–`) are replaced with hyphen `-`

## Indentation Reconstruction

When code screenshots have shallow margins or when Tesseract drops leading whitespace, the indentation engine reconstructs the scope hierarchy:

1. **Analysis:** The engine checks if existing indentation is already consistent across at least 35% of lines. If so, it preserves and snaps indentation to the nearest multiple of the target indent size (2 or 4 spaces).
2. **Scope Walking:** If whitespace was lost:
   - Tokens ending with `:` (Python, YAML) increment the indentation depth for subsequent lines.
   - Opening braces (`{`, `(`, `[`) increment depth.
   - Closing braces (`}`, `)`, `]`) decrement depth.
   - Control keywords such as `else`, `elif`, `catch`, `finally` trigger immediate line dedents.

/**
 * Code heuristics engine for OCR post-processing.
 * Restores syntax symbols, strips terminal/IDE line number artifacts,
 * repairs common OCR glyph confusions, and reconstructs code indentation.
 */

export interface HeuristicOptions {
  stripLineNumbers?: boolean;
  stripPromptPrefixes?: boolean;
  normalizeQuotes?: boolean;
  repairMonospaceGlyphs?: boolean;
  reconstructIndentation?: boolean;
  targetIndentSize?: 2 | 4;
}



/**
 * Detects and strips column line numbers (e.g., "1 |", "2 |", "01:", "1 ", "2 ")
 * commonly found on IDE gutters or tutorial screen recordings.
 */
export function stripLineNumberGutter(rawLines: string[]): string[] {
  const nonEmptyLines = rawLines.filter(l => l.trim().length > 0);
  if (nonEmptyLines.length < 2) return rawLines;

  // Patterns for line number gutters:
  // 1) "1 |   code" or "1| code"
  // 2) "1:   code" or "01: code"
  // 3) "1    code" (monotonic sequence of leading numbers)
  const pipePattern = /^\s*(\d{1,4})\s*\|\s?/;
  const colonPattern = /^\s*(\d{1,4})\s*:\s?/;
  const bareNumberPattern = /^\s*(\d{1,4})\s{2,}/;

  let pipeMatches = 0;
  let colonMatches = 0;
  let bareMatches = 0;

  for (const line of nonEmptyLines) {
    if (pipePattern.test(line)) pipeMatches++;
    if (colonPattern.test(line)) colonMatches++;
    if (bareNumberPattern.test(line)) bareMatches++;
  }

  const threshold = Math.max(2, Math.floor(nonEmptyLines.length * 0.45));

  if (pipeMatches >= threshold) {
    return rawLines.map(line => line.replace(pipePattern, ''));
  }
  if (colonMatches >= threshold) {
    return rawLines.map(line => line.replace(colonPattern, ''));
  }
  if (bareMatches >= threshold) {
    return rawLines.map(line => line.replace(bareNumberPattern, ''));
  }

  return rawLines;
}

/**
 * Removes interactive shell prompts and REPL prefixes.
 */
export function stripPromptPrefix(line: string): string {
  return line
    .replace(/^(\s*)[$#>»]\s+/, '$1')          // Bash / shell prompts $, #, >, »
    .replace(/^(\s*)>>>\s*/, '$1')             // Python REPL >>>
    .replace(/^(\s*)\.\.\.\s*/, '$1')          // Python continuation ...
    .replace(/^(\s*)In \[\d+\]:\s*/, '$1')     // IPython / Jupyter In [1]:
    .replace(/^(\s*)Out\[\d+\]:\s*/, '$1');    // IPython / Jupyter Out[1]:
}

/**
 * Repairs frequent OCR character confusions specifically in programming syntax.
 */
export function repairCodeGlyphs(text: string): string {
  let repaired = text;

  // 1. Normalize smart quotes to standard ASCII code quotes
  repaired = repaired
    .replace(/[“”„‟«»]/g, '"')
    .replace(/[‘’‚‛`]/g, (match) => (match === '`' ? '`' : "'"))
    .replace(/[—–]/g, '-'); // Replace em/en dashes with standard hyphen

  // 2. Fix OCR artifacts in arrow operators
  repaired = repaired
    .replace(/=\s*>/g, ' => ')
    .replace(/-\s*>/g, ' -> ')
    .replace(/<\s*=/g, ' <= ')
    .replace(/>\s*=/g, ' >= ')
    .replace(/!\s*=/g, ' != ')
    .replace(/=\s*=\s*=/g, ' === ')
    .replace(/=\s*=/g, ' == ');

  // 3. Fix typical OCR keyword misreadings (e.g. pipe or 1 mistaken for 'l')
  const keywordFixes: [RegExp, string][] = [
    [/\bc[o0O][nm]st\b/g, 'const'],
    [/\bfuncti[o0]n\b/g, 'function'],
    [/\bl[eé]t\b/g, 'let'],
    [/^[\|!1]et\b/gm, 'let'],
    [/\b[\|!1]mport\b/gm, 'import'],
    [/\bimpor[t7]\b/g, 'import'],
    [/\bre[t7]urn\b/g, 'return'],
    [/\b[a@]sync\b/g, 'async'],
    [/\bawa[i1]t\b/g, 'await'],
    [/\bint[e3]rface\b/g, 'interface'],
    [/\bstr[uü]ct\b/g, 'struct'],
    [/\bpackag[e3]\b/g, 'package'],
    [/\bSE[L1]ECT\b/g, 'SELECT'],
    [/\bFR[O0]M\b/g, 'FROM'],
    [/\bWH[E3]RE\b/g, 'WHERE']
  ];

  for (const [pattern, replacement] of keywordFixes) {
    repaired = repaired.replace(pattern, replacement);
  }

  // 4. Fix bracket spacing artifacts (e.g., "{ }" or "( )")
  repaired = repaired
    .replace(/\{\s*\}/g, '{}')
    .replace(/\(\s*\)/g, '()')
    .replace(/\[\s*\]/g, '[]');

  return repaired;
}

/**
 * Analyzes and reconstructs hierarchical code indentation.
 * Preserves existing leading whitespace if already consistent,
 * or recalculates indentation based on syntactic nesting.
 */
export function reconstructIndentationLevels(
  lines: string[],
  targetIndentSize: 2 | 4 = 2
): string[] {
  const indentString = ' '.repeat(targetIndentSize);
  const result: string[] = [];

  // Check if original lines already have meaningful indentation
  let linesWithIndent = 0;
  let linesWithCode = 0;

  for (const line of lines) {
    if (line.trim().length > 0) {
      linesWithCode++;
      if (/^\s{2,}|\t/.test(line)) {
        linesWithIndent++;
      }
    }
  }

  const hasSubstantialIndent = linesWithCode > 0 && (linesWithIndent / linesWithCode) > 0.35;

  if (hasSubstantialIndent) {
    // Normalize existing indentation to target indent size
    return lines.map(line => {
      const match = line.match(/^(\s*)/);
      if (!match) return line;
      const leadingSpaces = match[1].replace(/\t/g, indentString);
      const rawCount = leadingSpaces.length;
      if (rawCount === 0) return line;

      // Snap to nearest multiple of target indent size
      const level = Math.round(rawCount / targetIndentSize);
      const normalizedIndent = ' '.repeat(level * targetIndentSize);
      return normalizedIndent + line.trimStart();
    });
  }

  // Syntactic indentation reconstruction when OCR flattened leading whitespace
  let currentDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (trimmed.length === 0) {
      result.push('');
      continue;
    }

    // Check if line begins with a closing token that dedents
    const startsWithDedent = /^([\}\]\)]|\belse\b|\belif\b|\bcatch\b|\bfinally\b|\bend\b)/.test(trimmed);
    if (startsWithDedent && currentDepth > 0) {
      currentDepth--;
    }

    // Apply calculated indentation
    const prefix = ' '.repeat(currentDepth * targetIndentSize);
    result.push(prefix + trimmed);

    // Calculate changes for subsequent lines
    // Python colon rule
    const endsWithColon = trimmed.endsWith(':');
    // Brace counts
    const openBraces = (trimmed.match(/[\{\[\(]/g) || []).length;
    const closeBraces = (trimmed.match(/[\}\]\)]/g) || []).length;
    const netBraces = openBraces - closeBraces;

    if (endsWithColon) {
      currentDepth += 1;
    } else if (netBraces > 0) {
      currentDepth += netBraces;
    } else if (netBraces < 0 && !startsWithDedent) {
      currentDepth = Math.max(0, currentDepth + netBraces);
    }
  }

  return result;
}

/**
 * Main code sanitizer pipeline orchestrator.
 */
export function sanitizeCodeSnippet(
  rawOcrText: string,
  options: HeuristicOptions = {}
): string {
  const {
    stripLineNumbers = true,
    stripPromptPrefixes = true,
    normalizeQuotes = true,
    repairMonospaceGlyphs = true,
    reconstructIndentation = true,
    targetIndentSize = 2
  } = options;

  if (!rawOcrText || rawOcrText.trim().length === 0) {
    return '';
  }

  // 1. Initial glyph and quote normalization
  let processed = rawOcrText;
  if (normalizeQuotes || repairMonospaceGlyphs) {
    processed = repairCodeGlyphs(processed);
  }

  // 2. Line-by-line processing
  let lines = processed.split(/\r?\n/);

  // 3. Strip line number gutters
  if (stripLineNumbers) {
    lines = stripLineNumberGutter(lines);
  }

  // 4. Strip prompt prefixes
  if (stripPromptPrefixes) {
    lines = lines.map(line => stripPromptPrefix(line));
  }

  // 5. Clean trailing whitespace and normalize spaces
  lines = lines.map(line => line.replace(/\s+$/, ''));

  // 6. Indentation reconstruction
  if (reconstructIndentation) {
    lines = reconstructIndentationLevels(lines, targetIndentSize);
  }

  // 7. Final trim of excess empty lines at start/end
  while (lines.length > 0 && lines[0].trim() === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();

  return lines.join('\n');
}

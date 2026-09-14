/**
 * In-browser code formatting, casing transformer, and comment stripper.
 */

export type CasingStyle = 'camel' | 'snake' | 'pascal' | 'constant';

/**
 * Strips comments from code depending on language family.
 */
export function stripComments(code: string, languageId: string): string {
  if (!code) return '';

  if (languageId === 'python' || languageId === 'bash' || languageId === 'yaml') {
    // Strip # comments, taking care not to strip # inside quotes or shebangs
    return code
      .split('\n')
      .map((line) => {
        if (line.trim().startsWith('#!')) return line; // Preserve shebang
        const hashIdx = line.indexOf('#');
        if (hashIdx === -1) return line;
        // Basic check if # is inside string
        const before = line.slice(0, hashIdx);
        const singleQuotes = (before.match(/'/g) || []).length;
        const doubleQuotes = (before.match(/"/g) || []).length;
        if (singleQuotes % 2 === 1 || doubleQuotes % 2 === 1) return line;
        return line.slice(0, hashIdx).trimEnd();
      })
      .filter((line) => line.trim().length > 0)
      .join('\n');
  }

  if (languageId === 'sql') {
    // Strip -- comments
    return code
      .split('\n')
      .map((line) => {
        const idx = line.indexOf('--');
        return idx !== -1 ? line.slice(0, idx).trimEnd() : line;
      })
      .filter((line) => line.trim().length > 0)
      .join('\n');
  }

  // C-style languages (JS, TS, Rust, Go, C++)
  // Remove multi-line /* ... */
  let cleaned = code.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove single-line //
  cleaned = cleaned
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('//');
      if (idx === -1) return line.trimEnd();
      const before = line.slice(0, idx);
      const quotes = (before.match(/['"`]/g) || []).length;
      if (quotes % 2 === 1) return line.trimEnd();
      return line.slice(0, idx).trimEnd();
    })
    .filter((line) => line.trim().length > 0)
    .join('\n');

  return cleaned;
}

/**
 * Transforms identifier names matching a style into a new casing convention.
 */
export function toCasing(identifier: string, targetCase: CasingStyle): string {
  // Split identifier into words by underscores, hyphens, or camelCase transitions
  const words = identifier
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .trim()
    .split(/\s+/);

  if (words.length === 0 || words[0] === '') return identifier;

  switch (targetCase) {
    case 'camel':
      return words[0] + words.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    case 'pascal':
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    case 'snake':
      return words.join('_');
    case 'constant':
      return words.join('_').toUpperCase();
  }
}

/**
 * Applies identifier casing transformation throughout a snippet.
 */
export function transformSnippetCasing(code: string, targetCase: CasingStyle): string {
  // Find candidate variable/function identifiers (at least 3 chars, letters/digits/underscores)
  // Preserves language keywords
  const reserved = new Set([
    'const', 'let', 'var', 'function', 'return', 'import', 'export', 'default',
    'class', 'interface', 'type', 'async', 'await', 'from', 'package', 'struct',
    'impl', 'public', 'private', 'static', 'mut', 'pub', 'fn', 'def', 'if', 'else',
    'for', 'while', 'try', 'catch', 'finally', 'switch', 'case', 'break', 'continue',
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'ORDER', 'GROUP', 'BY'
  ]);

  return code.replace(/\b[a-zA-Z_][a-zA-Z0-9_]{2,}\b/g, (token) => {
    if (reserved.has(token) || reserved.has(token.toUpperCase())) {
      return token;
    }
    return toCasing(token, targetCase);
  });
}

/**
 * In-browser code formatting normalizer.
 * Standardizes operators spacing, braces, and indentation.
 */
export function formatCode(code: string, _languageId: string, indentSize: 2 | 4 = 2): string {
  if (!code) return '';

  const indentStr = ' '.repeat(indentSize);
  const lines = code.split('\n');
  const formattedLines: string[] = [];
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      // Don't accumulate more than one consecutive empty line
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
      }
      continue;
    }

    // Operator spacing normalization
    line = line
      .replace(/\s*([=+\-*/%&|^<>!]=|[=+\-*/%&|^<>!]|=>|->)\s*/g, (match, op) => {
        // Avoid spacing inside comments or special cases like ::
        if (op === '!' && !match.includes('=')) return '!';
        return ` ${op} `;
      })
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*;\s*$/g, ';')
      .replace(/\s*:\s*/g, ': ')
      .replace(/\s{2,}/g, ' ');

    // Dedent on closing tokens
    const isDedent = /^([\}\]\)]|\belse\b|\belif\b|\bcatch\b|\bfinally\b)/.test(line);
    if (isDedent && depth > 0) {
      depth--;
    }

    formattedLines.push(indentStr.repeat(depth) + line);

    // Calculate changes for subsequent lines
    const opens = (line.match(/[\{\[\(]/g) || []).length;
    const closes = (line.match(/[\}\]\)]/g) || []).length;
    const endsWithColon = line.endsWith(':');

    if (endsWithColon) {
      depth++;
    } else {
      depth = Math.max(0, depth + (opens - closes));
    }
  }

  return formattedLines.join('\n');
}

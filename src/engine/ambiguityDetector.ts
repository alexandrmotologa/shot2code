/**
 * Token Ambiguity and OCR Glitch Detector.
 * Identifies suspicious character sequences, unbalanced delimiters,
 * and frequent OCR artifacts to alert the developer for manual inspection.
 */

export interface AmbiguityAlert {
  id: string;
  lineNumber: number; // 1-indexed
  columnStart: number;
  columnEnd: number;
  token: string;
  suggestedFix?: string;
  severity: 'warning' | 'hint';
  reason: string;
}

export function detectAmbiguities(code: string): AmbiguityAlert[] {
  const alerts: AmbiguityAlert[] = [];
  if (!code || code.trim().length === 0) return alerts;

  const lines = code.split('\n');

  // 1. Bracket & delimiter balance checker
  const bracketStack: { char: string; line: number; col: number }[] = [];
  const bracketPairs: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
  const openBrackets = new Set(['(', '{', '[']);

  lines.forEach((line, lineIdx) => {
    const lineNum = lineIdx + 1;

    // Check line-level ambiguities
    // A) Non-standard / weird unicode symbols from video compression
    const artifactRegex = /[©®§°±×÷¶µ†‡]/g;
    let match: RegExpExecArray | null;
    while ((match = artifactRegex.exec(line)) !== null) {
      alerts.push({
        id: `artifact-${lineNum}-${match.index}`,
        lineNumber: lineNum,
        columnStart: match.index,
        columnEnd: match.index + match[0].length,
        token: match[0],
        severity: 'warning',
        reason: 'Suspicious non-ASCII artifact likely produced by video compression noise.',
      });
    }

    // B) Pipe or exclamation used at word boundaries instead of 'l' or 'I'
    const pipeAsLetterRegex = /(?:^|\s)([|!1][a-zA-Z]{2,})\b/g;
    while ((match = pipeAsLetterRegex.exec(line)) !== null) {
      const token = match[1];
      const tokenIndex = match.index + match[0].indexOf(token);
      const fixed = token.replace(/^[|!1]/, 'l');
      alerts.push({
        id: `pipe-${lineNum}-${tokenIndex}`,
        lineNumber: lineNum,
        columnStart: tokenIndex,
        columnEnd: tokenIndex + token.length,
        token: token,
        suggestedFix: fixed,
        severity: 'warning',
        reason: `Character '${token[0]}' appears to be a misrecognized 'l' or 'I'.`,
      });
    }

    // C) Number 0 inside an alphanumeric word (e.g. c0nst, functi0n, err0r)
    const zeroInWordRegex = /\b([a-zA-Z]+0[a-zA-Z]*|[a-zA-Z]*0[a-zA-Z]+)\b/g;
    while ((match = zeroInWordRegex.exec(line)) !== null) {
      const fixed = match[0].replace(/0/g, 'o');
      alerts.push({
        id: `zero-${lineNum}-${match.index}`,
        lineNumber: lineNum,
        columnStart: match.index,
        columnEnd: match.index + match[0].length,
        token: match[0],
        suggestedFix: fixed,
        severity: 'hint',
        reason: "Digit '0' found inside an identifier. Did you mean 'o'?",
      });
    }

    // D) Smart quote remnants
    const smartQuoteRegex = /[“”‘’‚‛]/g;
    while ((match = smartQuoteRegex.exec(line)) !== null) {
      alerts.push({
        id: `quote-${lineNum}-${match.index}`,
        lineNumber: lineNum,
        columnStart: match.index,
        columnEnd: match.index + 1,
        token: match[0],
        suggestedFix: '"',
        severity: 'warning',
        reason: 'Smart typographic quote detected. Standard code requires ASCII quotes.',
      });
    }

    // Delimiter tracking (ignoring comments/strings simplified)
    for (let col = 0; col < line.length; col++) {
      const char = line[col];
      if (openBrackets.has(char)) {
        bracketStack.push({ char, line: lineNum, col });
      } else if (bracketPairs[char]) {
        if (bracketStack.length === 0) {
          alerts.push({
            id: `unmatched-close-${lineNum}-${col}`,
            lineNumber: lineNum,
            columnStart: col,
            columnEnd: col + 1,
            token: char,
            severity: 'warning',
            reason: `Unmatched closing bracket '${char}'.`,
          });
        } else {
          const last = bracketStack.pop();
          if (last && last.char !== bracketPairs[char]) {
            alerts.push({
              id: `mismatched-bracket-${lineNum}-${col}`,
              lineNumber: lineNum,
              columnStart: col,
              columnEnd: col + 1,
              token: char,
              severity: 'warning',
              reason: `Mismatched bracket '${char}' closes '${last.char}' from line ${last.line}.`,
            });
          }
        }
      }
    }
  });

  // Any unclosed brackets remaining in stack
  for (const unclosed of bracketStack) {
    alerts.push({
      id: `unclosed-open-${unclosed.line}-${unclosed.col}`,
      lineNumber: unclosed.line,
      columnStart: unclosed.col,
      columnEnd: unclosed.col + 1,
      token: unclosed.char,
      severity: 'warning',
      reason: `Unclosed bracket '${unclosed.char}'.`,
    });
  }

  return alerts;
}

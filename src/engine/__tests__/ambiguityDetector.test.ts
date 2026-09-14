import { describe, it, expect } from 'vitest';
import { detectAmbiguities } from '../ambiguityDetector';

describe('ambiguityDetector Engine', () => {
  it('detects pipe character misread as letter in identifier', () => {
    const code = '|et counter = 0;';
    const alerts = detectAmbiguities(code);
    expect(alerts.some((a) => a.token === '|et' && a.suggestedFix === 'let')).toBe(true);
  });

  it('detects zero inside a word identifier', () => {
    const code = 'const my0bject = {};';
    const alerts = detectAmbiguities(code);
    expect(alerts.some((a) => a.token === 'my0bject' && a.suggestedFix === 'myobject')).toBe(true);
  });

  it('detects video compression non-ASCII artifacts', () => {
    const code = 'const result = calculate() ©;';
    const alerts = detectAmbiguities(code);
    expect(alerts.some((a) => a.token === '©')).toBe(true);
  });

  it('flags unclosed brackets', () => {
    const code = 'function init() {\n  const x = [1, 2, 3;\n}';
    const alerts = detectAmbiguities(code);
    expect(alerts.some((a) => a.reason.includes('Mismatched bracket') || a.reason.includes('Unclosed bracket'))).toBe(true);
  });

  it('returns no false positives on clean code', () => {
    const cleanCode = `
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return count;
}
    `;
    const alerts = detectAmbiguities(cleanCode);
    expect(alerts.filter((a) => a.severity === 'warning')).toHaveLength(0);
  });
});

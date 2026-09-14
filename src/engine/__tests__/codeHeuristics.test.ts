import { describe, it, expect } from 'vitest';
import {
  stripLineNumberGutter,
  stripPromptPrefix,
  repairCodeGlyphs,
  reconstructIndentationLevels,
  sanitizeCodeSnippet,
} from '../codeHeuristics';

describe('codeHeuristics Engine', () => {
  describe('stripLineNumberGutter', () => {
    it('strips pipe-separated line number gutters (1 | code)', () => {
      const input = [
        '1 | const greeting = "Hello World";',
        '2 | console.log(greeting);',
        '3 | return true;',
      ];
      const result = stripLineNumberGutter(input);
      expect(result).toEqual([
        'const greeting = "Hello World";',
        'console.log(greeting);',
        'return true;',
      ]);
    });

    it('strips colon-separated line numbers (01: code)', () => {
      const input = [
        '01: def calculate_metrics():',
        '02:     return {"accuracy": 0.98}',
      ];
      const result = stripLineNumberGutter(input);
      expect(result).toEqual([
        'def calculate_metrics():',
        '    return {"accuracy": 0.98}',
      ]);
    });

    it('preserves code when leading digits are part of statements', () => {
      const input = [
        'const x = 10;',
        'const y = 20;',
      ];
      const result = stripLineNumberGutter(input);
      expect(result).toEqual(input);
    });
  });

  describe('stripPromptPrefix', () => {
    it('removes shell dollar prompts', () => {
      expect(stripPromptPrefix('$ npm run test')).toBe('npm run test');
      expect(stripPromptPrefix('  $ git status')).toBe('  git status');
    });

    it('removes Python REPL prompts', () => {
      expect(stripPromptPrefix('>>> import math')).toBe('import math');
      expect(stripPromptPrefix('... math.sqrt(16)')).toBe('math.sqrt(16)');
    });

    it('removes Jupyter notebook prompts', () => {
      expect(stripPromptPrefix('In [1]: import pandas as pd')).toBe('import pandas as pd');
    });
  });

  describe('repairCodeGlyphs', () => {
    it('normalizes smart quotes to standard quotes', () => {
      const input = 'const title = “Shot2Code”; const char = ‘x’;';
      const output = repairCodeGlyphs(input);
      expect(output).toBe('const title = "Shot2Code"; const char = \'x\';');
    });

    it('fixes arrow function spacing', () => {
      expect(repairCodeGlyphs('const add = (a, b)=>a + b;')).toBe('const add = (a, b) => a + b;');
    });

    it('fixes common OCR keyword misreadings', () => {
      expect(repairCodeGlyphs('c0nst value = 42;')).toBe('const value = 42;');
      expect(repairCodeGlyphs('functi0n test() {}')).toBe('function test() {}');
      expect(repairCodeGlyphs('let token = "abc";')).toBe('let token = "abc";');
    });
  });

  describe('reconstructIndentationLevels', () => {
    it('reconstructs block indentation based on braces', () => {
      const flattened = [
        'function compute(items) {',
        'let total = 0;',
        'for (const item of items) {',
        'total += item.value;',
        '}',
        'return total;',
        '}',
      ];
      const formatted = reconstructIndentationLevels(flattened, 2);
      expect(formatted).toEqual([
        'function compute(items) {',
        '  let total = 0;',
        '  for (const item of items) {',
        '    total += item.value;',
        '  }',
        '  return total;',
        '}',
      ]);
    });

    it('reconstructs Python indentation based on colons', () => {
      const flattened = [
        'def process_order(order):',
        'if order.is_valid:',
        'save_to_db(order)',
        'return True',
      ];
      const formatted = reconstructIndentationLevels(flattened, 4);
      expect(formatted).toEqual([
        'def process_order(order):',
        '    if order.is_valid:',
        '        save_to_db(order)',
        '        return True',
      ]);
    });
  });

  describe('sanitizeCodeSnippet complete pipeline', () => {
    it('processes full OCR artifact snippet into clean syntax', () => {
      const rawOcr = [
        '1 | $ def greet(name):',
        '2 |     print(“Hello”, name)',
        '3 |     re7urn True',
      ].join('\n');

      const sanitized = sanitizeCodeSnippet(rawOcr, { targetIndentSize: 4 });
      expect(sanitized).toBe([
        'def greet(name):',
        '    print("Hello", name)',
        '    return True',
      ].join('\n'));
    });
  });
});

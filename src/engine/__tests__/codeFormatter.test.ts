import { describe, it, expect } from 'vitest';
import { formatCode, toCasing, transformSnippetCasing, stripComments } from '../codeFormatter';

describe('codeFormatter Engine', () => {
  describe('toCasing', () => {
    it('converts to camelCase', () => {
      expect(toCasing('user_first_name', 'camel')).toBe('userFirstName');
      expect(toCasing('UserFirstName', 'camel')).toBe('userFirstName');
    });

    it('converts to snake_case', () => {
      expect(toCasing('userFirstName', 'snake')).toBe('user_first_name');
      expect(toCasing('UserFirstName', 'snake')).toBe('user_first_name');
    });

    it('converts to PascalCase', () => {
      expect(toCasing('user_first_name', 'pascal')).toBe('UserFirstName');
      expect(toCasing('userFirstName', 'pascal')).toBe('UserFirstName');
    });

    it('converts to CONSTANT_CASE', () => {
      expect(toCasing('userFirstName', 'constant')).toBe('USER_FIRST_NAME');
    });
  });

  describe('transformSnippetCasing', () => {
    it('transforms variable identifiers while preserving keywords', () => {
      const code = 'const user_id = 42;\nreturn user_id;';
      const result = transformSnippetCasing(code, 'camel');
      expect(result).toBe('const userId = 42;\nreturn userId;');
    });
  });

  describe('stripComments', () => {
    it('strips JavaScript single and multi-line comments', () => {
      const code = '// Header comment\nconst x = 10; /* inline */\n// Footer';
      const result = stripComments(code, 'typescript');
      expect(result).toBe('const x = 10;');
    });

    it('strips Python hash comments', () => {
      const code = '# Python config\nport = 8080 # default port';
      const result = stripComments(code, 'python');
      expect(result).toBe('port = 8080');
    });

    it('strips SQL dash comments', () => {
      const code = '-- Select active users\nSELECT id FROM users;';
      const result = stripComments(code, 'sql');
      expect(result).toBe('SELECT id FROM users;');
    });
  });

  describe('formatCode', () => {
    it('normalizes operator spacing and indentation', () => {
      const input = 'const x=10+5;\nif(x>10){\nreturn true;\n}';
      const formatted = formatCode(input, 'javascript', 2);
      expect(formatted).toContain('const x = 10 + 5;');
      expect(formatted).toContain('  return true;');
    });
  });
});

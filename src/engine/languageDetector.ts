/**
 * Programming language detection engine.
 * Computes heuristic confidence scores across common programming languages
 * based on syntax keywords, type signatures, and import structures.
 */

export interface DetectedLanguage {
  id: string;
  name: string;
  confidence: number; // 0 to 1
  fileExtension: string;
}

interface LanguageSignature {
  id: string;
  name: string;
  fileExtension: string;
  keywords: string[];
  patterns: RegExp[];
}

const LANGUAGE_SIGNATURES: LanguageSignature[] = [
  {
    id: 'python',
    name: 'Python',
    fileExtension: 'py',
    keywords: ['def', 'class', 'import', 'from', 'self', 'elif', 'lambda', 'async def', 'with as', '__init__', 'print'],
    patterns: [
      /def\s+[a-zA-Z_]\w*\s*\(/,
      /import\s+[a-zA-Z_]\w*/,
      /from\s+[a-zA-Z_]\w*\s+import/,
      /:\s*$/,
      /print\s*\(.*\)/,
      /if\s+__name__\s*==\s*['"]__main__['"]:/,
      /\bNone\b/,
      /\bTrue\b|\bFalse\b/
    ]
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    fileExtension: 'ts',
    keywords: ['interface', 'type', 'const', 'let', 'export', 'import', 'from', 'return', 'async', 'await', 'readonly', 'as'],
    patterns: [
      /:\s*(string|number|boolean|any|void|unknown|never)\b/,
      /interface\s+[A-Z]\w*/,
      /type\s+[A-Z]\w*\s*=/,
      /<[A-Z]\w*>/,
      /export\s+(default\s+)?(function|class|interface|type|const)/,
      /import\s+.*\s+from\s+['"].*['"]/
    ]
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    fileExtension: 'js',
    keywords: ['function', 'const', 'let', 'var', 'return', 'export', 'import', 'document', 'window', 'console.log'],
    patterns: [
      /const\s+[a-zA-Z_]\w*\s*=/,
      /function\s+[a-zA-Z_]\w*\s*\(/,
      /console\.log\s*\(/,
      /=>\s*\{/,
      /module\.exports\s*=/
    ]
  },
  {
    id: 'rust',
    name: 'Rust',
    fileExtension: 'rs',
    keywords: ['fn', 'let mut', 'pub struct', 'impl', 'match', 'use std', 'enum', 'pub fn', 'Ok', 'Err', 'Some', 'None'],
    patterns: [
      /fn\s+[a-zA-Z_]\w*\s*\(/,
      /pub\s+(struct|enum|fn|trait)/,
      /impl(<.*>)?\s+[A-Z]\w*/,
      /#\[derive\(.*\)\]/,
      /println!\s*\(.*\)/,
      /&mut\s+/,
      /->\s*(Result|Option|<.*>|[A-Z]\w*)/
    ]
  },
  {
    id: 'go',
    name: 'Go',
    fileExtension: 'go',
    keywords: ['package', 'func', 'import', 'type struct', 'go func', 'chan', 'defer', 'nil', 'make', 'var'],
    patterns: [
      /package\s+[a-zA-Z_]\w*/,
      /func\s+(\([a-zA-Z_]\w*\s+\*?[A-Z]\w*\)\s+)?[a-zA-Z_]\w*\s*\(/,
      /type\s+[A-Z]\w*\s+struct\s*\{/,
      /:=\s*/,
      /fmt\.(Println|Printf|Sprintf)/,
      /go\s+[a-zA-Z_]\w*\(/
    ]
  },
  {
    id: 'sql',
    name: 'SQL',
    fileExtension: 'sql',
    keywords: ['SELECT', 'FROM', 'WHERE', 'INSERT INTO', 'UPDATE', 'DELETE', 'GROUP BY', 'ORDER BY', 'JOIN', 'CREATE TABLE'],
    patterns: [
      /\bSELECT\b[\s\S]*?\bFROM\b/i,
      /\bCREATE\s+TABLE\b/i,
      /\bINSERT\s+INTO\b/i,
      /\bLEFT\s+JOIN\b|\bINNER\s+JOIN\b/i,
      /\bGROUP\s+BY\b|\bORDER\s+BY\b/i,
      /\bWITH\s+[a-zA-Z_]\w*\s+AS\s*\(/i
    ]
  },
  {
    id: 'html',
    name: 'HTML',
    fileExtension: 'html',
    keywords: ['<!DOCTYPE html>', '<html>', '<div', '<script', '<style', '<head>', '<body>', '</span>'],
    patterns: [
      /<!DOCTYPE\s+html>/i,
      /<([a-z][a-z0-9]*)\b[^>]*>[\s\S]*?<\/\1>/i,
      /<div\b[^>]*>/i,
      /<span\b[^>]*>/i
    ]
  },
  {
    id: 'css',
    name: 'CSS',
    fileExtension: 'css',
    keywords: ['color:', 'background:', 'display:', 'margin:', 'padding:', 'flex', 'grid', '@media'],
    patterns: [
      /[.#]?[a-zA-Z0-9_-]+\s*\{\s*[a-z-]+:\s*[^;]+;\s*\}/,
      /@media\s*\(.*\)/,
      /@keyframes\s+[a-zA-Z0-9_-]+/
    ]
  },
  {
    id: 'cpp',
    name: 'C++',
    fileExtension: 'cpp',
    keywords: ['#include', 'std::', 'namespace', 'cout', 'cin', 'nullptr', 'template', 'vector', 'auto'],
    patterns: [
      /#include\s*<[a-z0-9_]+>/i,
      /std::[a-z0-9_]+/i,
      /int\s+main\s*\(/,
      /cout\s*<</,
      /template\s*<.*>/
    ]
  },
  {
    id: 'bash',
    name: 'Shell',
    fileExtension: 'sh',
    keywords: ['#!/bin/bash', 'curl', 'chmod', 'sudo', 'echo', 'grep', 'mkdir', 'npm run', 'export'],
    patterns: [
      /^#!\/bin\/(bash|sh|zsh)/,
      /\b(npm|pnpm|yarn|git|docker|kubectl)\s+[a-z]+/,
      /\becho\s+["'].*["']/,
      /\|\s*grep\b/
    ]
  },
  {
    id: 'json',
    name: 'JSON',
    fileExtension: 'json',
    keywords: [],
    patterns: [
      /^\s*\{\s*"[a-zA-Z0-9_]+"\s*:/,
      /^\s*\[\s*\{/
    ]
  }
];

/**
 * Detects the programming language of a given code snippet.
 */
export function detectLanguage(codeSnippet: string): DetectedLanguage {
  if (!codeSnippet || codeSnippet.trim().length === 0) {
    return {
      id: 'plaintext',
      name: 'Plain Text',
      confidence: 0,
      fileExtension: 'txt'
    };
  }

  const sample = codeSnippet.slice(0, 3000);
  let bestMatch: LanguageSignature = LANGUAGE_SIGNATURES[0];
  let maxScore = -1;

  for (const lang of LANGUAGE_SIGNATURES) {
    let score = 0;

    // Check keywords
    for (const kw of lang.keywords) {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(sample)) {
        score += 2.0;
      }
    }

    // Check specific structural patterns
    for (const pattern of lang.patterns) {
      if (pattern.test(sample)) {
        score += 4.0;
      }
    }

    // Language specific discriminators
    if (lang.id === 'typescript' && (sample.includes('interface ') || sample.includes(': string') || sample.includes(': number'))) {
      score += 5.0;
    }
    if (lang.id === 'python' && sample.includes('def ') && sample.includes(':')) {
      score += 4.0;
    }
    if (lang.id === 'rust' && (sample.includes('fn ') || sample.includes('impl '))) {
      score += 5.0;
    }
    if (lang.id === 'go' && (sample.includes('package ') || sample.includes('func '))) {
      score += 6.0;
    }
    if (lang.id === 'sql' && (sample.toUpperCase().includes('SELECT') && sample.toUpperCase().includes('FROM'))) {
      score += 6.0;
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = lang;
    }
  }

  const normalizedConfidence = maxScore > 0 ? Math.min(1.0, maxScore / 20.0) : 0.1;

  return {
    id: bestMatch.id,
    name: bestMatch.name,
    confidence: Number(normalizedConfidence.toFixed(2)),
    fileExtension: bestMatch.fileExtension
  };
}

import { describe, it, expect } from 'vitest';
import { detectLanguage } from '../languageDetector';

describe('languageDetector Engine', () => {
  it('detects Python code accurately', () => {
    const pythonSnippet = `
from fastapi import FastAPI
app = FastAPI()

async def get_status():
    return {"status": "ok"}
    `;
    const result = detectLanguage(pythonSnippet);
    expect(result.id).toBe('python');
    expect(result.fileExtension).toBe('py');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('detects TypeScript code with interfaces', () => {
    const tsSnippet = `
interface UserRecord {
  id: string;
  email: string;
  isActive: boolean;
}

export const fetchUser = async (id: string): Promise<UserRecord> => {
  return { id, email: 'test@example.com', isActive: true };
};
    `;
    const result = detectLanguage(tsSnippet);
    expect(result.id).toBe('typescript');
    expect(result.fileExtension).toBe('ts');
  });

  it('detects Rust with struct and impl', () => {
    const rustSnippet = `
pub struct BufferManager {
    capacity: usize,
}

impl BufferManager {
    pub fn new(capacity: usize) -> Self {
        BufferManager { capacity }
    }
}
    `;
    const result = detectLanguage(rustSnippet);
    expect(result.id).toBe('rust');
    expect(result.fileExtension).toBe('rs');
  });

  it('detects Go with packages and goroutines', () => {
    const goSnippet = `
package workerpool

import (
    "fmt"
    "sync"
)

func Process() {
    var wg sync.WaitGroup
    go func() {
        fmt.Println("Worker running")
    }()
}
    `;
    const result = detectLanguage(goSnippet);
    expect(result.id).toBe('go');
    expect(result.fileExtension).toBe('go');
  });

  it('detects SQL with CTE and queries', () => {
    const sqlSnippet = `
WITH ranked_orders AS (
    SELECT customer_id, order_date, amount,
           RANK() OVER (PARTITION BY customer_id ORDER BY amount DESC) as rnk
    FROM orders
    WHERE order_status = 'COMPLETED'
)
SELECT * FROM ranked_orders WHERE rnk = 1;
    `;
    const result = detectLanguage(sqlSnippet);
    expect(result.id).toBe('sql');
    expect(result.fileExtension).toBe('sql');
  });
});

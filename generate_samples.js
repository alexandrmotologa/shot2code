import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// Load resvg from parent scratch folder
const { Resvg } = require('../node_modules/@resvg/resvg-js');

const samples = [
  {
    name: 'python_async_sample.png',
    title: 'telemetry_service.py — Python 3.12',
    lang: 'python',
    lines: [
      { text: 'from fastapi import FastAPI, HTTPException', color: '#c586c0' },
      { text: 'from pydantic import BaseModel', color: '#c586c0' },
      { text: 'import httpx', color: '#c586c0' },
      { text: '', color: '' },
      { text: 'app = FastAPI(title="TelemetryGateway")', color: '#9cdcfe' },
      { text: '', color: '' },
      { text: 'class EventPayload(BaseModel):', color: '#4ec9b0' },
      { text: '    event_id: str', color: '#9cdcfe' },
      { text: '    status: str', color: '#9cdcfe' },
      { text: '    latency_ms: float', color: '#9cdcfe' },
      { text: '', color: '' },
      { text: '@app.post("/api/v1/telemetry")', color: '#dcdcaa' },
      { text: 'async def ingest_event(payload: EventPayload):', color: '#4ec9b0' },
      { text: '    if payload.latency_ms < 0:', color: '#c586c0' },
      { text: '        raise HTTPException(status_code=400, detail="Invalid latency")', color: '#ce9178' },
      { text: '    async with httpx.AsyncClient() as client:', color: '#c586c0' },
      { text: '        response = await client.post("https://ingest.internal/log", json=payload.model_dump())', color: '#9cdcfe' },
      { text: '    return {"accepted": True, "code": response.status_code}', color: '#ce9178' }
    ]
  },
  {
    name: 'react_hook_sample.png',
    title: 'useDebounce.ts — TypeScript',
    lang: 'typescript',
    lines: [
      { text: "import { useState, useEffect, useCallback } from 'react';", color: '#c586c0' },
      { text: '', color: '' },
      { text: 'interface UseDebounceOptions {', color: '#4ec9b0' },
      { text: '  delay?: number;', color: '#9cdcfe' },
      { text: '  leading?: boolean;', color: '#9cdcfe' },
      { text: '}', color: '#ffd700' },
      { text: '', color: '' },
      { text: 'export function useDebounce<T>(value: T, options: UseDebounceOptions = {}): T {', color: '#dcdcaa' },
      { text: '  const { delay = 300 } = options;', color: '#9cdcfe' },
      { text: '  const [debouncedValue, setDebouncedValue] = useState<T>(value);', color: '#9cdcfe' },
      { text: '', color: '' },
      { text: '  useEffect(() => {', color: '#c586c0' },
      { text: '    const handler = setTimeout(() => {', color: '#9cdcfe' },
      { text: '      setDebouncedValue(value);', color: '#dcdcaa' },
      { text: '    }, delay);', color: '#9cdcfe' },
      { text: '', color: '' },
      { text: '    return () => {', color: '#c586c0' },
      { text: '      clearTimeout(handler);', color: '#dcdcaa' },
      { text: '    };', color: '#9cdcfe' },
      { text: '  }, [value, delay]);', color: '#9cdcfe' },
      { text: '', color: '' },
      { text: '  return debouncedValue;', color: '#c586c0' },
      { text: '}', color: '#ffd700' }
    ]
  },
  {
    name: 'rust_struct_sample.png',
    title: 'cache.rs — Rust 2021',
    lang: 'rust',
    lines: [
      { text: 'use std::collections::HashMap;', color: '#c586c0' },
      { text: 'use std::sync::Arc;', color: '#c586c0' },
      { text: 'use tokio::sync::RwLock;', color: '#c586c0' },
      { text: '', color: '' },
      { text: '#[derive(Debug, Clone)]', color: '#dcdcaa' },
      { text: 'pub struct CacheEntry<V> {', color: '#4ec9b0' },
      { text: '    pub value: V,', color: '#9cdcfe' },
      { text: '    pub ttl_secs: u64,', color: '#9cdcfe' },
      { text: '}', color: '#ffd700' },
      { text: '', color: '' },
      { text: 'pub struct AsyncCache<K, V> {', color: '#4ec9b0' },
      { text: '    store: Arc<RwLock<HashMap<K, CacheEntry<V>>>>,', color: '#9cdcfe' },
      { text: '}', color: '#ffd700' },
      { text: '', color: '' },
      { text: 'impl<K, V> AsyncCache<K, V> {', color: '#c586c0' },
      { text: '    pub async fn get(&self, key: &K) -> Option<V> {', color: '#dcdcaa' },
      { text: '        let guard = self.store.read().await;', color: '#9cdcfe' },
      { text: '        guard.get(key).map(|entry| entry.value.clone())', color: '#9cdcfe' },
      { text: '    }', color: '#ffd700' },
      { text: '}', color: '#ffd700' }
    ]
  },
  {
    name: 'go_concurrency_sample.png',
    title: 'worker_pool.go — Go 1.22',
    lang: 'go',
    lines: [
      { text: 'package workerpool', color: '#c586c0' },
      { text: '', color: '' },
      { text: 'import (', color: '#c586c0' },
      { text: '\t"context"', color: '#ce9178' },
      { text: '\t"sync"', color: '#ce9178' },
      { text: '\t"time"', color: '#ce9178' },
      { text: ')', color: '#c586c0' },
      { text: '', color: '' },
      { text: 'type JobResult struct {', color: '#4ec9b0' },
      { text: '\tWorkerID int', color: '#9cdcfe' },
      { text: '\tLatency  time.Duration', color: '#9cdcfe' },
      { text: '\tErr      error', color: '#9cdcfe' },
      { text: '}', color: '#ffd700' },
      { text: '', color: '' },
      { text: 'func ProcessJobs(ctx context.Context, workers int) <-chan JobResult {', color: '#dcdcaa' },
      { text: '\tresults := make(chan JobResult, workers)', color: '#9cdcfe' },
      { text: '\tvar wg sync.WaitGroup', color: '#9cdcfe' },
      { text: '\treturn results', color: '#c586c0' },
      { text: '}', color: '#ffd700' }
    ]
  },
  {
    name: 'sql_query_sample.png',
    title: 'monthly_cohorts.sql — PostgreSQL 16',
    lang: 'sql',
    lines: [
      { text: 'WITH monthly_sales AS (', color: '#c586c0' },
      { text: '    SELECT', color: '#569cd6' },
      { text: "        region,", color: '#9cdcfe' },
      { text: "        DATE_TRUNC('month', order_date) AS sale_month,", color: '#dcdcaa' },
      { text: '        SUM(amount) AS total_revenue,', color: '#dcdcaa' },
      { text: '        COUNT(DISTINCT customer_id) AS unique_buyers', color: '#dcdcaa' },
      { text: '    FROM customer_orders', color: '#569cd6' },
      { text: "    WHERE order_status = 'COMPLETED'", color: '#ce9178' },
      { text: '    GROUP BY region, sale_month', color: '#569cd6' },
      { text: '), ranked_regions AS (', color: '#c586c0' },
      { text: '    SELECT region, sale_month, total_revenue,', color: '#9cdcfe' },
      { text: '        RANK() OVER (PARTITION BY sale_month ORDER BY total_revenue DESC) AS rnk', color: '#dcdcaa' },
      { text: '    FROM monthly_sales', color: '#569cd6' },
      { text: ')', color: '#c586c0' },
      { text: 'SELECT * FROM ranked_regions WHERE rnk <= 3;', color: '#569cd6' }
    ]
  }
];

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

for (const sample of samples) {
  const width = 940;
  const lineHeight = 26;
  const topBarHeight = 44;
  const paddingBottom = 30;
  const height = topBarHeight + (sample.lines.length * lineHeight) + paddingBottom;

  let linesSvg = '';
  sample.lines.forEach((line, idx) => {
    const y = topBarHeight + 22 + (idx * lineHeight);
    const lineNum = idx + 1;
    const lineText = line.text.replace(/\t/g, '    ');
    linesSvg += `
      <text x="44" y="${y}" font-family="JetBrains Mono, Consolas, monospace" font-size="14" fill="#6e7681" text-anchor="end">${lineNum}</text>
      <text x="64" y="${y}" font-family="JetBrains Mono, Consolas, monospace" font-size="14" fill="${line.color || '#d4d4d4'}" xml:space="preserve">${escapeHtml(lineText)}</text>
    `;
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.5"/>
      </filter>
    </defs>
    <!-- Background Frame -->
    <rect x="0" y="0" width="${width}" height="${height}" rx="12" fill="#1e1e1e" stroke="#333333" stroke-width="1.5" />
    
    <!-- Title Bar -->
    <rect x="0" y="0" width="${width}" height="${topBarHeight}" rx="12" fill="#181818" />
    <rect x="0" y="32" width="${width}" height="12" fill="#181818" />
    <line x1="0" y1="${topBarHeight}" x2="${width}" y2="${topBarHeight}" stroke="#2d2d2d" stroke-width="1" />
    
    <!-- Window controls -->
    <circle cx="22" cy="22" r="6" fill="#ff5f56" />
    <circle cx="42" cy="22" r="6" fill="#ffbd2e" />
    <circle cx="62" cy="22" r="6" fill="#27c93f" />

    <!-- Window Title -->
    <text x="${width / 2}" y="27" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="13" fill="#8b949e" text-anchor="middle" font-weight="500">${escapeHtml(sample.title)}</text>
    
    <!-- Code Editor Gutter Divider -->
    <line x1="52" y1="${topBarHeight}" x2="52" y2="${height}" stroke="#282828" stroke-width="1" />

    <!-- Code Lines -->
    ${linesSvg}
  </svg>`;

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width }
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  const outputPath = path.join('public', 'samples', sample.name);
  fs.writeFileSync(outputPath, pngBuffer);
  console.log(`Rendered ${sample.name} (${pngBuffer.length} bytes)`);
}

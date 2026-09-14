/**
 * Client-Side AI Syntax Polish Engine (BYOK).
 * Allows users to optionally provide their own API key for Gemini, OpenAI,
 * or connect to a local Ollama instance to repair OCR hallucinations.
 */

export type AiProvider = 'gemini' | 'openai' | 'ollama';

export interface AiPolishConfig {
  provider: AiProvider;
  apiKey?: string;
  endpointUrl?: string; // For Ollama or custom proxy
  modelName?: string;
}

const SYSTEM_PROMPT = `You are a specialized code OCR syntax repair engine.
The user will provide code extracted via OCR from a video tutorial or screenshot.
Your task:
1. Fix blurred or hallucinated characters (e.g., misread variable names, missing semicolons, broken arrows, smart quotes).
2. Restore precise indentation and syntax structure.
3. DO NOT add conversational commentary, explanations, or introductory text.
4. Output ONLY the corrected source code.`;

export async function polishCodeWithAi(
  rawCode: string,
  language: string,
  config: AiPolishConfig
): Promise<string> {
  const { provider, apiKey, endpointUrl, modelName } = config;

  if (provider === 'gemini') {
    if (!apiKey) throw new Error('Gemini API key is required.');
    const model = modelName || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${SYSTEM_PROMPT}\n\nLanguage: ${language}\n\nCode:\n${rawCode}` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Gemini request failed: ${response.status}`);
    }

    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || rawCode;
    // Strip markdown codeblocks if model wrapped output
    text = text.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
    return text.trim();
  }

  if (provider === 'openai') {
    if (!apiKey) throw new Error('OpenAI API key is required.');
    const model = modelName || 'gpt-4o-mini';
    const url = 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Language: ${language}\n\nCode to repair:\n${rawCode}` },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `OpenAI request failed: ${response.status}`);
    }

    const data = await response.json();
    let text = data?.choices?.[0]?.message?.content || rawCode;
    text = text.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
    return text.trim();
  }

  if (provider === 'ollama') {
    const base = endpointUrl || 'http://localhost:11434';
    const model = modelName || 'codellama';
    const url = `${base}/api/generate`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: `${SYSTEM_PROMPT}\n\nLanguage: ${language}\n\nCode:\n${rawCode}`,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status}. Is Ollama running on ${base}?`);
    }

    const data = await response.json();
    let text = data?.response || rawCode;
    text = text.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
    return text.trim();
  }

  return rawCode;
}

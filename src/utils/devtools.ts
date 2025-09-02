/**
 * Logs a formatted and styled AI Studio code snippet to the browser's DevTools console.
 * @param prompt The prompt string sent to the Gemini API.
 */
export function logAiStudioCode(prompt: string) {
  const codeSnippet = `
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function run() {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: \`${prompt.replace(/`/g, '\\`')}\`,
  });
  console.log(response.text);
}

run();
  `;

  console.log(
    '%cAI Studio Code Snippet:',
    'color: #ffffff; background-color: #4f46e5; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
  );
  console.log(
    `%c${codeSnippet.trim()}`,
    'background-color: #f1f5f9; color: #1e293b; padding: 8px; border-radius: 4px; font-family: monospace; border: 1px solid #e2e8f0;'
  );
}

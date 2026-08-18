import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

async function testAllModels() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-exp',
    'gemini-pro'
  ];

  console.log('Testing available models to find one with higher quota...');

  for (const model of models) {
    console.log(`\nTesting ${model}...`);
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: 'Hello'
      });
      console.log(`[SUCCESS] ${model} works! Response: ${response.text}`);
    } catch (error: any) {
      console.log(`[FAILED] ${model} - ${error.message}`);
    }
  }
}

testAllModels();

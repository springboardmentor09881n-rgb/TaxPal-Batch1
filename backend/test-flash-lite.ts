import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

async function testFlashLite() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  console.log(`\nTesting gemini-3.5-flash-lite...`);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: 'Hello'
    });
    console.log(`[SUCCESS] gemini-3.5-flash-lite works! Response: ${response.text}`);
  } catch (error: any) {
    console.log(`[FAILED] gemini-3.5-flash-lite - ${error.message}`);
  }
}

testFlashLite();

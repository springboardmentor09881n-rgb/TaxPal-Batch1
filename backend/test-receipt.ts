import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

async function measureReceiptLatency() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  console.log(`\nTesting receipt extraction with gemini-3.6-flash...`);
  const start = Date.now();
  try {
    // Generate a dummy 1x1 base64 transparent PNG to simulate image
    const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const mimeType = 'image/png';
    
    const prompt = 'Analyze this receipt and extract details in JSON.';

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
      }
    });
    
    console.log(`Response received in ${Date.now() - start}ms`);
    console.log(response.text);
  } catch (error: any) {
    console.log(`Error:`, error.message);
  }
}

measureReceiptLatency();

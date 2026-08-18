import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

async function measureLatency(modelName: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  console.log(`\nTesting ${modelName}...`);
  const start = Date.now();
  try {
    const responseStream = await ai.models.generateContentStream({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
    });
    
    let firstToken = true;
    for await (const chunk of responseStream) {
      if (firstToken) {
        console.log(`TTFT (Time To First Token) for ${modelName}: ${Date.now() - start}ms`);
        firstToken = false;
      }
    }
    console.log(`Total Time for ${modelName}: ${Date.now() - start}ms`);
  } catch (error: any) {
    console.log(`Error for ${modelName}:`, error.message);
  }
}

async function run() {
  await measureLatency('gemini-1.5-flash');
  await measureLatency('gemini-1.5-flash-8b');
  await measureLatency('gemini-3.6-flash');
}

run();

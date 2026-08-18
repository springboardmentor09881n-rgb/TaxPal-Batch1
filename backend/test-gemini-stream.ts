import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
    });
    
    console.log('Stream started');
    for await (const chunk of responseStream) {
      process.stdout.write(chunk.text || '');
    }
    console.log('\nStream finished');
  } catch (error: any) {
    console.error('\nError occurred:', error.message);
  }
}

test();

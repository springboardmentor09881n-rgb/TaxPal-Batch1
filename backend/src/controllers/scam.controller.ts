import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const analyzeScam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ success: false, message: 'Message text is required for analysis.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ success: false, message: 'AI processing is not configured' });
      return;
    }

    const prompt = `
      You are an expert financial security analyst. Analyze the following message/email text to detect if it is a financial scam, phishing attempt, or fraud.
      
      Look for common indicators such as:
      - Urgent or threatening payment requests
      - Requests for OTPs, PINs, passwords, or CVVs
      - Suspicious or mismatched payment links
      - Impersonation of authorities (IRS, bank, etc.)
      - Unexpected account changes or payment requests

      TEXT TO ANALYZE:
      """
      ${message}
      """

      Return your analysis strictly in the following JSON format without markdown blocks:
      {
        "riskLevel": "Low" | "Medium" | "High",
        "detectedIndicators": ["indicator 1", "indicator 2"],
        "explanation": "A clear, concise explanation of why this is or isn't a scam.",
        "recommendedSafeAction": "What the user should do next (e.g., Do not click links, contact the bank directly)."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
      }
    });

    const aiResponseText = response.text || '{}';
    let analysisData = {};

    try {
      analysisData = JSON.parse(aiResponseText);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', aiResponseText);
      res.status(500).json({ success: false, message: 'AI returned malformed data', raw: aiResponseText });
      return;
    }

    // Add a mandatory disclaimer
    res.status(200).json({
      success: true,
      data: {
        ...analysisData,
        disclaimer: 'This scam detection is an AI assistant and not a guaranteed fraud determination. Always exercise caution and contact institutions directly.',
      }
    });

  } catch (error: any) {
    console.error('Scam Detection Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

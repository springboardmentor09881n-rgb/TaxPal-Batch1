import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

export const analyzeScam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ success: false, message: 'Message text is required for analysis.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not configured. Falling back to local mock scam analysis.');
      
      const lowerMessage = message.toLowerCase();
      let riskLevel = 'Low';
      const detectedIndicators: string[] = [];
      let explanation = 'No typical indicators of financial fraud or scam were detected in this message.';
      let recommendedSafeAction = 'This message seems safe, but always verify the sender before sharing any personal details.';

      if (lowerMessage.includes('otp') || lowerMessage.includes('pin') || lowerMessage.includes('password') || lowerMessage.includes('cvv')) {
        riskLevel = 'High';
        detectedIndicators.push('Request for sensitive authentication details (OTP/PIN/CVV)');
        explanation = 'The message asks for temporary authentication credentials, passwords, or card security numbers, which legitimate institutions never request via text/email.';
        recommendedSafeAction = 'NEVER share OTPs, PINs, or passwords with anyone. Delete this message immediately.';
      } else if (lowerMessage.includes('urgent') || lowerMessage.includes('block') || lowerMessage.includes('suspend') || lowerMessage.includes('win') || lowerMessage.includes('lottery') || lowerMessage.includes('prize')) {
        riskLevel = 'High';
        detectedIndicators.push('Urgency or offering unexpected rewards/prizes');
        explanation = 'Scammers use false urgency or promise unexpected prizes to manipulate emotions and bypass normal security cautions.';
        recommendedSafeAction = 'Do not click any links or download attachments. Report the sender as spam.';
      } else if (lowerMessage.includes('link') || lowerMessage.includes('click') || lowerMessage.includes('http')) {
        riskLevel = 'Medium';
        detectedIndicators.push('Contains external links');
        explanation = 'The message contains links that request action. Ensure the link points to a verified official domain before proceeding.';
        recommendedSafeAction = 'Hover over the link to verify the destination URL. If unsure, navigate to the service directly via your browser rather than clicking the link.';
      }

      res.status(200).json({
        success: true,
        data: {
          riskLevel,
          detectedIndicators,
          explanation,
          recommendedSafeAction,
          disclaimer: 'This scam detection is a mock/offline fallback response because the AI Service API Key is not configured. Always exercise caution.',
        }
      });
      return;
    }

    // Initialize Gemini Client
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

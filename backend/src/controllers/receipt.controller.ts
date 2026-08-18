import { Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const scanReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (!req.file) {
      throw new ApiError(400, 'Please upload a receipt image or PDF file.');
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new ApiError(500, 'Receipt Scanner is not configured (Missing API Key)');
    }

    // Convert file buffer to base64
    const base64Data = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const prompt = `
      Analyze this receipt and extract the following details accurately in JSON format.
      Do not include markdown blocks or any other text, just pure JSON.
      
      Required JSON structure:
      {
        "transactionType": "Income" | "Expense",
        "description": "Short description or merchant name",
        "amount": 0.00, // Extracted number only
        "date": "YYYY-MM-DD", // Try your best to format it this way
        "category": "String (e.g. Food, Software, Travel, Supplies, etc.)",
        "currency": "String (e.g. USD, EUR)"
      }
    `;

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
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

    if (!response.text) {
      throw new ApiError(500, 'Failed to extract data from receipt.');
    }

    // Parse the generated JSON
    let extractedData;
    try {
      extractedData = JSON.parse(response.text);
    } catch (parseError) {
      console.error('Failed to parse Gemini output:', response.text);
      throw new ApiError(500, 'Failed to parse extracted receipt data.');
    }

    // Return the extracted data to the frontend for review
    res.status(200).json(new ApiResponse(extractedData, 'Receipt scanned successfully. Please review the details.'));
  } catch (error) {
    next(error);
  }
};

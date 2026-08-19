import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

export const extractReceiptData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const file = req.file;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!file) {
      res.status(400).json({ success: false, message: 'No document uploaded' });
      return;
    }

    let extractedData;

    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not configured. Falling back to local mock document parsing.');
      
      const fileName = (file.originalname || '').toLowerCase();
      let category = 'Other';
      let merchant = 'Business Vendor';
      let amount = 45.99;
      const currency = 'USD';
      
      if (fileName.includes('uber') || fileName.includes('travel') || fileName.includes('meal') || fileName.includes('taxi') || fileName.includes('cab')) {
        category = 'Travel/Meals';
        merchant = 'Uber';
      } else if (fileName.includes('aws') || fileName.includes('github') || fileName.includes('software') || fileName.includes('saas') || fileName.includes('subscription')) {
        category = 'Software/SaaS';
        merchant = 'AWS Cloud Services';
      } else if (fileName.includes('hardware') || fileName.includes('gadgets') || fileName.includes('laptop') || fileName.includes('computer') || fileName.includes('phone')) {
        category = 'Hardware/Gadgets';
        merchant = 'Electronics Store';
      } else if (fileName.includes('marketing') || fileName.includes('ads') || fileName.includes('facebook') || fileName.includes('google')) {
        category = 'Marketing/Ads';
        merchant = 'Google Ads';
      } else if (fileName.includes('supplies') || fileName.includes('office') || fileName.includes('paper')) {
        category = 'Office Supplies';
        merchant = 'Office Depot';
      } else if (fileName.includes('starbucks') || fileName.includes('coffee') || fileName.includes('cafe') || fileName.includes('food')) {
        category = 'Travel/Meals';
        merchant = 'Starbucks';
      }

      // Try to extract a number from the file name if present
      const numberMatch = fileName.match(/\b\d+(?:[._]\d+)?\b/);
      if (numberMatch) {
        const parsedAmount = parseFloat(numberMatch[0].replace('_', '.'));
        if (!isNaN(parsedAmount) && parsedAmount > 0) {
          amount = parsedAmount;
        }
      } else {
        // Generate a random realistic amount
        amount = Number((Math.random() * 150 + 10).toFixed(2));
      }

      const today = new Date();
      const date = today.toISOString().split('T')[0];

      extractedData = {
        merchant,
        date,
        amount,
        currency,
        category,
      };

      res.status(200).json({
        success: true,
        message: 'Document analyzed successfully (Offline Mock Mode). Please confirm the details.',
        data: extractedData,
      });
      return;
    }

    // Initialize Gemini Client
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Convert file buffer to base64
    const base64Data = file.buffer.toString('base64');
    
    // Determine mime type (Google GenAI accepts specific mime types for images/PDFs)
    let mimeType = file.mimetype;
    if (mimeType === 'application/pdf') {
      mimeType = 'application/pdf';
    } else if (mimeType.includes('image')) {
      mimeType = file.mimetype;
    } else {
      res.status(400).json({ success: false, message: 'Unsupported file format for AI extraction' });
      return;
    }

    const prompt = `
      You are a highly accurate financial AI assistant. 
      Analyze this receipt/invoice and extract the following fields in strict JSON format:
      {
        "merchant": "Name of the store or merchant",
        "date": "YYYY-MM-DD",
        "amount": 123.45,
        "currency": "USD or relevant currency code",
        "category": "Suggest a generic category like 'Food', 'Travel', 'Equipment', 'Office Supplies'"
      }
      If a field cannot be found, return null for that field. Do not include markdown formatting or backticks around the JSON.
    `;

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      }
    });

    const aiResponseText = response.text || '{}';

    try {
      extractedData = JSON.parse(aiResponseText);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', aiResponseText);
      res.status(500).json({ success: false, message: 'AI returned malformed data', raw: aiResponseText });
      return;
    }

    // Return the extracted data for user confirmation (DO NOT auto-create transaction)
    res.status(200).json({
      success: true,
      message: 'Document analyzed successfully. Please confirm the details.',
      data: extractedData,
    });
  } catch (error: any) {
    console.error('Document Extraction API Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

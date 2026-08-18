import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { Budget } from '../models/Budget';
import { Transaction } from '../models/Transaction';
import { TaxEstimate } from '../models/TaxEstimate';
import { Chat } from '../models/Chat';
import { User } from '../models/User';
import { Types } from 'mongoose';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!message) {
      res.status(400).json({ message: 'Message is required' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ message: 'Chatbot is not configured (Missing API Key)' });
      return;
    }

    const userRecord = await User.findById(userId);
    const country = userRecord?.country?.toLowerCase() || 'india';
    const currencySymbols: Record<string, string> = {
      india: '₹',
      usa: '$',
      uk: '£',
      australia: 'A$',
      canada: 'C$',
      euro: '€',
    };
    const currencySymbol = currencySymbols[country] || '₹';
    const currencyName = country === 'usa' ? 'US Dollars' : (country === 'uk' ? 'British Pounds' : 'Indian Rupees');

    // 1. Intent-Based Routing: Decide if we need DB data
    const lowerMessage = message.toLowerCase();
    const needsFinancialData = /budget|spend|spent|transaction|expense|tax|report|income|earn|salary|money|revenue|profit|due|status|summary|calculate/i.test(lowerMessage);

    let financialContext = '';
    
    if (needsFinancialData) {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [budgets, transactions, latestTaxEstimate] = await Promise.all([
        Budget.find({ userId, month: currentMonth }),
        Transaction.find({ userId, transactionDate: { $gte: thirtyDaysAgo } }).sort({ transactionDate: -1 }).limit(15),
        TaxEstimate.findOne({ userId }).sort({ createdAt: -1 })
      ]);

      financialContext = `
        CURRENT MONTH BUDGETS:
        ${budgets.map(b => `- ${b.category}: Limit ${currencySymbol}${b.limit}`).join('\n')}
        
        RECENT TRANSACTIONS (Last 30 Days):
        ${transactions.map(t => `- [${t.transactionDate.toISOString().split('T')[0]}] ${t.type} in ${t.category}: ${currencySymbol}${t.amount} (Desc: ${t.description})`).join('\n')}
        
        LATEST TAX ESTIMATE:
        ${latestTaxEstimate ? `Quarter: ${latestTaxEstimate.quarter}, Estimated Tax: ${currencySymbol}${latestTaxEstimate.estimatedTax}, Status: ${latestTaxEstimate.status}` : 'No estimate found.'}
      `;
    }

    // 2. Fetch or Create Chat Session
    let chatSession;
    let isNewSession = false;
    
    if (sessionId) {
      chatSession = await Chat.findOne({ _id: sessionId, user: userId });
    }
    
    if (!chatSession) {
      const title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
      chatSession = new Chat({ user: userId, title, messages: [] });
      isNewSession = true;
    }

    // Append user message
    chatSession.messages.push({ role: 'user', content: message, timestamp: new Date() });
    
    if (isNewSession) {
      await chatSession.save(); // Save immediately to get an ID
    }

    // 3. Construct System Prompt
    const systemInstruction = `
      You are an advanced, secure, and privacy-focused financial assistant for the TaxPal app. 
      You help freelancers manage their taxes, budgets, and expenses.
      
      CORE CAPABILITIES (Always answer questions related to these):
      - 🧮 Tax calculation explanation
      - 💰 Budget & spending insights
      - 💳 Transaction/expense queries
      - 📅 Tax payment due-date/status
      - 📊 Monthly financial summary
      - 📄 Report generation (PDF/CSV)

      STRICT RULES:
      1. ONLY answer questions related to personal finance, budgeting, taxes, and the user's expenses. Decline anything else.
      2. Do NOT invent financial data. If no context is provided for a due date, explain general tax deadlines.
      3. ZERO EXPLANATION POLICY: Give extremely direct, short, and brief answers. Do not over-explain. Do not give financial advice disclaimers. 
      4. Answer in a few sentences maximum. Speed and conciseness are your top priority.
      5. REPORT GENERATION: If the user explicitly asks you to generate, download, or create a report, you MUST include the exact text [ACTION: GENERATE_REPORT:PDF] or [ACTION: GENERATE_REPORT:CSV] at the very end of your response depending on the format they requested. If they did not specify a format, default to [ACTION: GENERATE_REPORT:PDF].
      6. CURRENCY: Always format currency values in ${currencyName} (${currencySymbol}). Do NOT use other currencies unless explicitly asked.

      USER'S ANONYMIZED FINANCIAL CONTEXT:
      ${financialContext}
    `;

    // 4. Call Gemini API
    // Format history for Gemini ensuring STRICT alternation and history truncation
    const recentMessages = chatSession.messages.slice(-10); // Keep only last 10 messages
    const contents: any[] = [];
    let lastRole = '';
    
    for (const msg of recentMessages) {
      if (msg.role !== lastRole) {
        contents.push({
          role: msg.role,
          parts: [{ text: msg.content || ' ' }],
        });
        lastRole = msg.role;
      } else if (contents.length > 0) {
        contents[contents.length - 1].parts[0].text += '\n\n' + (msg.content || ' ');
      }
    }

    // Prepare SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // If it's a new session, send the session ID to the client first
    if (isNewSession) {
      res.write(`data: ${JSON.stringify({ sessionId: chatSession._id })}\n\n`);
    }

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.5-flash-lite',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    let fullAiResponse = '';
    for await (const chunk of responseStream) {
      if (chunk.text) {
        fullAiResponse += chunk.text;
        // Send chunk to client
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    // Send final END event
    res.write(`data: ${JSON.stringify({ end: true })}\n\n`);
    res.end();

    // After streaming completes, save to DB
    chatSession.messages.push({ role: 'model', content: fullAiResponse, timestamp: new Date() });
    await chatSession.save();
  } catch (error: any) {
    console.error('Chat API Error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getChatSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const sessions = await Chat.find({ user: userId })
      .select('_id title updatedAt')
      .sort({ updatedAt: -1 });
    
    res.status(200).json({ sessions });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getChatHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const sessionId = req.params.id;
    let chatSession;
    
    if (sessionId && sessionId !== 'history') {
      chatSession = await Chat.findOne({ _id: sessionId, user: userId });
    } else {
      // Fallback to getting the latest session if id is 'history' (backwards compat)
      chatSession = await Chat.findOne({ user: userId }).sort({ updatedAt: -1 });
    }
    
    res.status(200).json({ messages: chatSession?.messages || [] });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const sessionId = req.params.id;
    
    let chatSession;
    if (sessionId && sessionId !== 'history') {
      chatSession = await Chat.findOneAndDelete({ _id: sessionId, user: userId });
    } else {
      // Fallback for backwards compatibility: delete all sessions if 'history' is passed
      await Chat.deleteMany({ user: userId });
      chatSession = true; // just to pass the check
    }
    
    if (!chatSession) {
      res.status(404).json({ message: 'Chat session not found' });
      return;
    }

    res.status(200).json({ message: 'Chat session deleted successfully' });
  } catch (error: any) {
    console.error('Delete Chat API Error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

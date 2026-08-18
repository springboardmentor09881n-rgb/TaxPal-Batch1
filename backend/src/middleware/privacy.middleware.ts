import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to detect and block sensitive information from being sent to the AI service.
 */
export const privacyFilter = (req: Request, res: Response, next: NextFunction): void => {
  const { message } = req.body;

  if (!message) {
    next();
    return;
  }

  // Define regex patterns for sensitive information
  const sensitivePatterns = [
    // Credit card numbers (13-19 digits, possibly with spaces or dashes)
    /\b(?:\d[ -]*?){13,19}\b/,
    // SSN (AAA-GG-SSSS)
    /\b\d{3}-\d{2}-\d{4}\b/,
    // Common keywords followed by numbers or short strings (OTP, PIN, Password, CVV)
    /\b(password|passwd|pwd|cvv|cvc|otp|pin)[\s:=]+[\w\d@#$!%*?&]+\b/i,
    // Bank account or routing numbers (basic pattern of 8-12 digits usually requested in finance)
    /\b(account|routing)[\s#:=]+(\d{8,12})\b/i,
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      res.status(400).json({
        success: false,
        message: 'For your security, please do not share bank account numbers, card details, OTPs, PINs or passwords.',
      });
      return; // Stop execution
    }
  }

  next();
};

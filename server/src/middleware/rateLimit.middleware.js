import rateLimit from 'express-rate-limit';

// Rate limiter for anonymous complaint submissions (e.g. max 10 per hour per IP)
export const complaintSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Submission rate limit exceeded. To protect system integrity, please try again in an hour.'
  }
});

// Rate limiter for login attempts (max 5 failed attempts per 15 mins)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

// Rate limiter for tracking ID lookup (max 60 lookups per 15 mins)
export const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Tracking lookup limit exceeded. Please wait a few moments.'
  }
});


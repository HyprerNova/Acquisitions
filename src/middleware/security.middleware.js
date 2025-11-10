// src/middleware/security.middleware.js
import aj from '#config/arcjet.js';
import { slidingWindow } from '@arcjet/node';
import logger from '#config/logger.js';

export const securityMiddleware = async (req, res, next) => {
  try {
    // 1. SKIP ARCJET ENTIRELY IN TEST MODE (MOST IMPORTANT)
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const role = req.user?.role || 'guest';
    let limit;
    let message;

    const rateLimitMode =
      process.env.NODE_ENV === 'production' ? 'LIVE' : 'DRY_RUN';

    switch (role) {
      case 'admin':
        limit = process.env.NODE_ENV === 'production' ? 100 : 1000;
        message = 'You have reached the maximum number of requests as admin';
        break;
      case 'user':
        limit = process.env.NODE_ENV === 'production' ? 50 : 500;
        message = 'You have reached the maximum number of requests as user';
        break;
      default:
        limit = process.env.NODE_ENV === 'production' ? 20 : 200;
        message = 'You have reached the maximum number of requests as guest';
        break;
    }

    // 2. ADD USER-AGENT HEADER IF MISSING (Supertest doesn't send it)
    if (!req.headers['user-agent']) {
      req.headers['user-agent'] = 'Supertest/1.0';
    }

    const rateLimitRule = slidingWindow({
      max: limit,
      mode: rateLimitMode,
      interval: '1m',
      name: `${role}-rate-limit`,
    });

    const client = aj.withRule(rateLimitRule);
    const decision = await client.protect(req);

    // SHIELD PROTECTION
    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn('Shield triggered', {
        ip: req.ip,
        ua: req.get('user-agent'),
      });
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    // RATE LIMIT EXCEEDED
    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        role,
        limit,
        remaining: decision.reason.remaining,
      });

      if (process.env.NODE_ENV === 'production') {
        return res.status(429).json({
          error: message,
          retryAfter: decision.reason.resetTime,
        });
      }
    }

    next();
  } catch (error) {
    // 3. NEVER CRASH THE SERVER — just log and continue
    logger.error('Security middleware error', { error: error.message });
    next(); // Don't call next(error) — let other handlers deal with it
  }
};

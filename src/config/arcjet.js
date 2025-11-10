import arcjet, { shield, detectBot, slidingWindow } from '@arcjet/node';

// Use DRY_RUN mode in development to avoid blocking legitimate requests
const arcjetMode = process.env.NODE_ENV === 'production' ? 'LIVE' : 'DRY_RUN';

const aj = arcjet({
  // Get your site key from https://app.arcjet.com and set it as an environment
  // variable rather than hard coding.
  key: process.env.ARCJET_KEY,
  rules: [
    // Shield protects your app from common attacks e.g. SQL injection
    shield({ mode: arcjetMode }),
    // Create a bot detection rule - more lenient in development
    detectBot({
      mode: arcjetMode,
      // Allow search engines and preview tools
      allow: [
        'CATEGORY:SEARCH_ENGINE', // Google, Bing, etc
        'CATEGORY:PREVIEW',
      ],
      // Block automated bots but allow browsers and API clients
      // In DRY_RUN mode (development), this won't actually block
      block: ['AUTOMATED'],
    }),
    // Global rate limit - more lenient in development
    slidingWindow({
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit in dev
      mode: arcjetMode,
      interval: '1m', // 1 minute window
    }),
  ],
});

export default aj;

import logger from '#config/logger.js';
import jwt from 'jsonwebtoken'; // Changed to default import (jsonwebtoken is CommonJS)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret';
const JWT_EXPIRE_IN = '1d';

export const jwtToken = {
  sign: payload => {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE_IN });
    } catch (e) {
      logger.error('Failed to sign token', e); // Fixed typo ("authenticated" -> "sign") and used 'e' instead of 'error'
      throw new Error('Failed to sign token'); // Updated error message for consistency
    }
  },

  verify: token => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      logger.error('Failed to verify token', e); // Fixed typo ("authenticate" -> "verify") and used 'e'
      throw new Error('Failed to verify token'); // Updated for consistency
    }
  },
};

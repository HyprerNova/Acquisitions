import logger from '#config/logger.js';
import { jwtToken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';

/**
 * Authentication middleware - verifies JWT token and sets req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = cookies.get(req, 'token');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify token
    const decoded = jwtToken.verify(token);

    // Set user info on request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    logger.error('Authentication error', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Authorization middleware - checks if user has admin role
 */
export const requireAdmin = async (req, res, next) => {
  try {
    // First ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      logger.warn(
        `Unauthorized access attempt by user ${req.user.email} with role ${req.user.role}`
      );
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    logger.error('Authorization error', error);
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

import aj from '#config/arcjet.js';
import { slidingWindow } from '@arcjet/node';
import logger from '#config/logger.js';

export const securityMiddleware = async (req, res, next) => {
    try{
        const role = req.user?.role || "guest";
        let limit;
        let message;

        // Use DRY_RUN mode in development to avoid blocking during testing
        const rateLimitMode = process.env.NODE_ENV === 'production' ? 'LIVE' : 'DRY_RUN';
        
        switch(role){
            case 'admin':
                limit = process.env.NODE_ENV === 'production' ? 100 : 1000; // Higher in dev
                message = 'You have reached the maximum number of requests as admin';
                break;
            case 'user':
                limit = process.env.NODE_ENV === 'production' ? 50 : 500; // Higher in dev
                message = 'You have reached the maximum number of requests as user';
                break;
            default:
                limit = process.env.NODE_ENV === 'production' ? 20 : 200; // Higher in dev
                message = 'You have reached the maximum number of requests as guest';
                break;
        }
        
        // CORRECT: Create the rule first
        const rateLimitRule = slidingWindow({
            max: limit,
            mode: rateLimitMode,
            interval: '1m',
            name: `${role}-rate-limit`
        });

        // Then pass the rule to withRule()
        const client = aj.withRule(rateLimitRule);
        
        const decision = await client.protect(req);

        // In development mode, log but don't block (DRY_RUN mode)
        // if(decision.isDenied() && decision.reason.isBot()){
        //     logger.warn('Bot detected (would block in production)', {
        //         ip: req.ip,
        //         userAgent: req.headers['user-agent'],
        //         mode: process.env.NODE_ENV
        //     });
        //     // Only block in production
        //     if (process.env.NODE_ENV === 'production') {
        //         return res.status(403).json({error: 'Forbidden'});
        //     }
        // }
        if(decision.isDenied() && decision.reason.isShield()){
            logger.warn('Shield blocked request (would block in production)', {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                mode: process.env.NODE_ENV
            });
            // Only block in production
            if (process.env.NODE_ENV === 'production') {
                return res.status(403).json({error: 'Forbidden'});
            }
        }
        if(decision.isDenied() && decision.reason.isRateLimit()){
            logger.warn('Rate limit exceeded', {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                mode: process.env.NODE_ENV
            });
            // Only block in production
            if (process.env.NODE_ENV === 'production') {
                return res.status(429).json({error: message});
            }
        }
        next();
    }catch(error){
        console.error('Error in security middleware',error);
        next(error);
    }
};
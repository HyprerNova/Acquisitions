import aj from '#config/arcjet.js';
import { slidingWindow } from '@arcjet/node';
import logger from '#config/logger.js';

export const securityMiddleware = async (req, res, next) => {
    try{
        const role = req.user?.role || "guest";
        let limit;
        let message;

        switch(role){
            case 'admin':
                limit = 20;
                message = 'You have reached the maximum number of requests as admin';
                break;
            case 'user':
                limit = 10;
                message = 'You have reached the maximum number of requests as user';
                break;
            default:
                limit = 5;
                message = 'You have reached the maximum number of requests as guest';
                break;
        }
        
        // CORRECT: Create the rule first
        const rateLimitRule = slidingWindow({
            max:limit,
            mode: 'LIVE',
            interval: '1m',
            name: `${role}-rate-limit`
        });

        // Then pass the rule to withRule()
        const client = aj.withRule(rateLimitRule);
        
        const decision = await client.protect(req);

        if(decision.isDenied() && decision.reason.isBot()){
            logger.error('Bot detected',{ip: req.ip,userAgent: req.headers['user-agent']});
            return res.status(403).json({error: 'Forbidden'});
        }
        if(decision.isDenied() && decision.reason.isShield()){
            logger.error('Bot detected',{ip: req.ip,userAgent: req.headers['user-agent']});
            return res.status(403).json({error: 'Forbidden'});
        }
        if(decision.isDenied() && decision.reason.isRateLimit()){
            logger.error('Rate limit exceeded',{ip: req.ip,userAgent: req.headers['user-agent']});
            return res.status(429).json({error: message});
        }
        next();
    }catch(error){
        console.error('Error in security middleware',error);
        next(error);
    }
};
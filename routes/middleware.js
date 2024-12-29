import { index } from '../coretify.config.js';
import redisClient from '../cache.config.js';
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import jwt from 'jsonwebtoken';


/**
 * Middleware to verify the JWT token from the `Authorization` header or cookies.
 * If the token is invalid or missing, an error response is sent.
 * If valid, the decoded user data is attached to the request object.
 */
export function authenticateToken(req, res, next) {

    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    // if no token provided from authorization
    // attempt to get the token data from cookies
    if (!token) {

        const cookies = req.cookies;

        token = cookies['token'];

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
    }

    jwt.verify(token, index.jwtSecretAdmin, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }

        req.user = user;
        next();
    });
};


/**
 * Rate limiter middleware to limit requests per IP address.
 * Uses Redis as a store for tracking request counts.
 *
 * This middleware restricts each IP to a maximum of `max` requests
 * within the specified `windowMs` duration. If `index.useRateLimit` is disabled,
 * the middleware simply calls `next()` to bypass the rate limiting.
 */
export const limiter = index.useRateLimit ? rateLimit({
    windowMs: 120 * 60 * 1000,  // 120 minutes
    max: 15,  // limit each IP to 15 requests per 120 minutes
    keyGenerator: (req) => {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        return ip;
    },
    store: new RedisStore({
        sendCommand: (...args) => {
            return redisClient.call(...args);
        },
    }),
    handler: (req, res) => {
        res.status(429).send('Too many requests, please try again later.');
    },
}) : (req, res, next) => next();
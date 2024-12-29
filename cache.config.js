import RedisClient from "ioredis";
import dotenv from 'dotenv';
dotenv.config();

// Configure Redis client
const redisClient = new RedisClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
});

export default redisClient;
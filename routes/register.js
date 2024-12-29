import { authenticateToken, limiter } from '../routes/middleware.js';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import express from 'express';
import bcrypt from 'bcryptjs';
import bodyParser from 'body-parser';

const register = express.Router();
const prisma = new PrismaClient();

register.use(bodyParser.json());


register.route('/application')
    .post(authenticateToken, limiter, async (req, res) => {
        try {

            const { app_name, app_type, app_url } = req.body;

            // validate the request body
            if (!app_name || !app_type || !app_url) {
                return limiter(req, res, () => {
                    return res.status(400).json({ message: 'Invalid Parameters' });
                });
            }

            // insert application to db
            const newApplication = await prisma.application.create({
                data: {
                    app_id: uuidv4(),
                    app_name,
                    app_type,
                    app_url
                },
            });

            return res.status(201).json({ message: 'Application registered successfully' });
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: 'Application registration failed' });
        }
    })


register.route('/user')
    .post(authenticateToken, limiter, async (req, res) => {
        try {

            const { username, password } = req.body;

            // validate the request body
            if (!username || !password) {
                return limiter(req, res, () => {
                    return res.status(400).json({ message: 'Invalid Parameters' });
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // insert user to db
            const newUser = await prisma.user.create({
                data: {
                    username,
                    password: hashedPassword, // Store the hashed password
                },
            });

            return res.status(201).json({ message: 'User registered successfully' });
        } catch (error) {
            // Handle unique constraint error (P2002)
            if (error.code === 'P2002' && error.meta.target === 'User_username_key') {
                return res.status(400).json({ error: 'Username already exists' });
            }
            return res.status(500).json({ error: 'User registration failed' });
        }
    })


/**
 * @swagger
 * /register/signup:
 *   post:
 *     summary: Register a user with a signup key
 *     tags:
 *       - Register
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               signup_key:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *         400:
 *           description: Invalid Parameters
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
*/
register.route('/signup')
    .post(async (req, res) => {
        try {

            const { username, password, signup_key } = req.body;

            // validate the request body
            if (!username || !password || !signup_key) {
                return limiter(req, res, () => {
                    return res.status(400).json({ message: 'Invalid Parameters' });
                });
            }

            // -- Update the signup key and mark it as used if valid
            const updatedSignupKey = await prisma.signupKey.update({
                where: { key: signup_key, usedAt: null },
                data: { usedAt: new Date() },
            }).catch(() => {
                // Handle invalid or already-used signup keys
                throw new Error('Invalid Signup Key');
            });

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // insert user to db
            const newUser = await prisma.user.create({
                data: {
                    username,
                    password: hashedPassword, // Store the hashed password
                },
            });

            return res.status(201).json({ message: 'User registered successfully' });
        } catch (error) {

            if (error.message === 'Invalid Signup Key') {
                return limiter(req, res, () => {
                    return res.status(403).json({ message: error.message });
                });
            }

            return res.status(500).json({ error: 'User registration failed' });
        }
    })


export default register;

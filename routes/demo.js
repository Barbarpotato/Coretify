import express from 'express';
import jwt from 'jsonwebtoken';
import { limiter } from './middleware.js';
import { index } from '../coretify.config.js';
import bodyParser from 'body-parser';

const demo = express.Router();

demo.use(bodyParser.json());

demo.route('/login')
    .post(limiter, async (req, res) => {

        const { username, password } = req.body;

        // validate the request body
        if (username !== "coretify@gmail.com" || password !== "12345") {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const token = jwt.sign({ username }, index.jwtSecret, { expiresIn: '1m' });

        res.json({ token });
    })

demo.route('/auth')
    .post(limiter, (req, res) => {

        const { token } = req.body;

        if (!token) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify the JWT token without using middleware
        jwt.verify(token, index.jwtSecret, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid token' });
            }

            // Token is valid, you can use the user information
            res.json({ message: 'Token is valid', user });
        });

    })


export default demo;

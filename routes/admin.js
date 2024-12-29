import express from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, limiter } from './middleware.js';
import { PrismaClient } from '@prisma/client';
import { index } from '../coretify.config.js';
import bodyParser from 'body-parser';

const admin = express.Router();
const prisma = new PrismaClient();

admin.use(bodyParser.json());

// ------------------------------------
// ** ADMIN INTERFACE **
// ------------------------------------

admin.route('')
    .get((req, res) => {

        // Get cookies from the request
        const cookies = req.cookies;

        // Example  : getting a specific cookie
        const token = cookies['token'];
        // Verify the JWT token
        jwt.verify(token, index.jwtSecretAdmin, async (err, user) => {

            // ** if jwt is invalid force redirect to login adin
            if (err) {
                return res.redirect('/login/admin');
            }

            // get  all the users data information
            // Find the user in the database
            const user_list = await prisma.user.findMany({
                select: {
                    username: true,
                    is_active: true,
                    created_at: true,
                    updated_at: true
                }
            });

            // ** if jwt is valid render the admin main page
            return res.render("admin/users/overview.ejs", {
                title: "Coretify - Admin",
                user_list: user_list
            });
        });
    })


admin.route('/applications_overview')
    .get((req, res) => {

        // Get cookies from the request
        const cookies = req.cookies;

        // Example  : getting a specific cookie
        const token = cookies['token'];
        // Verify the JWT token
        jwt.verify(token, index.jwtSecretAdmin, async (err, user) => {

            // ** if jwt is invalid force redirect to login adin
            if (err) {
                return res.redirect('/login/admin');
            }

            // get all the applications data information
            // Find the user in the database
            const application_list = await prisma.application.findMany({
                select: {
                    id: true,
                    app_id: true,
                    app_name: true,
                    app_url: true,
                    app_type: true,
                    created_at: true,
                    updated_at: true
                }
            });

            // get all the user data information
            const user_list = await prisma.user.findMany({
                where: {
                    is_active: true
                },
                select: {
                    username: true,
                    is_active: true,
                    created_at: true,
                    updated_at: true
                }
            });

            // ** if jwt is valid render the admin main page
            return res.render("admin/applications/overview.ejs", {
                title: "Coretify - Admin",
                application_list: application_list,
                user_list: user_list
            });
        });
    })


admin.route('/user_application/:app_id')
    .get(authenticateToken, async (req, res) => {

        const { app_id } = req.params;

        // validate the request parameter
        if (!app_id) {
            return res.status(400).json({ error: 'App ID is required' });
        }

        try {
            const user_applications = await prisma.userApplication.findMany({
                select: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            is_active: true,
                            created_at: true,
                            updated_at: true
                        }
                    },
                    application: {
                        select: {
                            id: true,
                            app_type: true,
                            app_id: true,
                            app_name: true,
                            app_url: true
                        }
                    }
                }
            });

            // ** group the applications by user
            // only get the data from application
            const group_by_app = user_applications.filter(object => object.application.app_id == app_id);

            // ** map user account and application
            const final_user_application = group_by_app.map(object => {
                return {
                    user_id: object.user.id,
                    username: object.user.username,
                    is_active: object.user.is_active,
                    created_at: object.user.created_at,
                    updated_at: object.user.updated_at,
                    app_id: object.application.id,
                }
            })

            return res.json(final_user_application);
        } catch (error) {
            console.error('Error fetching user-applications:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    })


admin.route('/logout')
    .get(authenticateToken, (req, res) => {
        res.clearCookie('token');
        res.render("partials/login.ejs", { title: "Coretify - Login Admin" });
    })


admin.route('/generate_signup_key')
    .get(authenticateToken, async (req, res) => {

        try {
            const key = uuidv4();
            await prisma.signupKey.create({
                data: {
                    key,
                },
            });
            return res.send(key);
        } catch (error) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    })

// ------------------------------------
// ** ADMIN ACTIONS **
// ------------------------------------

// **
// -- set user inactive
admin.route('/set_inactive')
    .post(authenticateToken, async (req, res) => {

        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        try {
            const user = await prisma.user.update({
                where: { username },
                data: { is_active: false }
            });
            res.status(200).json({ message: 'User deactivated successfully' });
        } catch (error) {
            return res.status(500).json({ error: 'User deactivation failed' });
        }
    })

// **
// -- set user active
admin.route('/set_active')
    .post(authenticateToken, async (req, res) => {

        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        try {
            const user = await prisma.user.update({
                where: { username },
                data: { is_active: true }
            });
            res.status(200).json({ message: 'User activated successfully' });
        } catch (error) {
            return res.status(500).json({ error: 'User deactivation failed' });
        }
    })

// **
// -- add user to the applications
admin.route('/add_user')
    .post(authenticateToken, async (req, res) => {

        const { username, app_id } = req.body;

        // validate the request body
        if (!username || !app_id) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        try {

            // ** Check if user and application exist
            const user = await prisma.user.findUnique({ where: { username: username } });
            const application = await prisma.application.findUnique({ where: { app_id: app_id } });

            if (!user || !application) {
                return res.status(404).json({ error: 'User or application not found' });
            }

            // ** Check if the user is already associated with this application
            const existingUserApplication = await prisma.userApplication.findFirst({
                where: {
                    user_id: user.id,
                    application_id: application.id
                }
            });

            if (existingUserApplication) {
                return res.status(400).json({ error: 'User is already associated with this application' });
            }

            // ** Create an entry in the UserApplication table
            const userApplication = await prisma.userApplication.create({
                data: {
                    user_id: user.id,
                    application_id: application.id,
                },
            });

            return res.json({
                "message": "User added successfully to application"
            })

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'User registration failed' });
        }
    })

// **
// -- Authentication for Super Admin in Admin Panel
admin.route('/auth')
    .post((req, res) => {

        const { token } = req.body;

        if (!token) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify the JWT token without using middleware
        jwt.verify(token, index.jwtSecret, (err, user) => {
            if (err) {
                // Apply limiter only when token verification fails
                return limiter(req, res, () => {
                    return res.status(403).json({ message: 'Invalid token' });
                });
            }

            // Token is valid, you can use the user information
            res.json({ message: 'Token is valid', user });
        });
    })

// **
// -- remove user from the applications
admin.route('/remove_user_application')
    .post(authenticateToken, async (req, res) => {

        const { user_id, app_id } = req.body;

        if (!user_id || !app_id) {
            return res.status(400).json({ error: 'Invalid Parameters' });
        }

        try {

            await prisma.userApplication.deleteMany({
                where: {
                    user_id: user_id,
                    application_id: app_id
                }
            });

            return res.json({
                "message": "User removed successfully from application"
            })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    })


// **
// -- remove application
admin.route('/remove_application')
    .post(authenticateToken, async (req, res) => {

        const { app_id } = req.body;

        if (!app_id) {
            return res.status(400).json({ error: 'Invalid Parameters' });
        }

        try {

            // ** make sure cannot delete the app if user_id still exist in user_application
            const user_applications = await prisma.userApplication.findMany({
                where: {
                    application_id: app_id
                }
            });

            if (user_applications.length > 0) {
                return res.status(400).json({ error: 'Cannot delete application. User in the application is exist' });
            }

            await prisma.application.delete({
                where: {
                    id: app_id
                }
            });

            return res.json({
                "message": "Application removed successfully"
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    })


export default admin;

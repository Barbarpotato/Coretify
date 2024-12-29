// ** CORETIFY CONFIGURATION **
// This file is used to configure the coretify bundling process.
// For more information, please refer to the README.md:
// https://github.com/Barbarpotato/Coretify/blob/main/README.md

// ** ENVIRONMENT VARIABLES  **
// This file is used to configure the environment variables for the coretify bundling process.
import dotenv from 'dotenv';
dotenv.config();

// ** MAIN CONFIGURATION **
// This file is used to configure the main configuration for the coretify bundling process.
export const index = {
    serverPort: 3000,
    jwtSecretAdmin: process.env.JWT_SECRET_ADMIN,
    jwtSecret: process.env.JWT_SECRET,
    corsOptions: {
        origin: function (origin, callback) {
            // you can specify more detail about origin here
            callback(null, true);
        },
        allowedHeaders: ['Content-Type', 'Authorization'],
        maxAge: 120, // 120 seconds = 2 minutes
    },
    useRateLimit: true
};

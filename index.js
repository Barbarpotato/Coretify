import express from 'express';
import cookieParser from 'cookie-parser';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import helmet from 'helmet'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import demo from './routes/demo.js';
import admin from './routes/admin.js';
import register from './routes/register.js';
import login from './routes/login.js';
import auth from './routes/auth.js';
import { index } from './coretify.config.js';
import cors from 'cors';

const app = express();

// Set the views directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const _css_swagger = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css"

app.set('trust proxy', true);

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));


// Swagger definition
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',  // OpenAPI version
        info: {
            title: 'Coretify Public API Documentation',
            version: '1.0.0',
            description: 'Documentation for the Coretify API Endpoints Provided for Third-Party Applications',
        },
    },
    // Path to the API specs
    apis: ['./routes/*.js'],
};

// Create swagger spec
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Use Swagger UI to serve docs at /api-docs
app.use('/documentations', swaggerUi.serve, swaggerUi.setup(swaggerDocs,
    {
        customCss:
            '.swagger-ui .opblock .opblock-summary-path-description-wrapper { align-items: center; display: flex; flex-wrap: wrap; gap: 0 10px; padding: 0 10px; width: 100%; }',
        customCssUrl: _css_swagger,
    }

));

app.use(helmet({
    hidePoweredBy: true, // Hide the X-Powered-By header
    frameguard: {         // Configure frameguard
        action: 'deny'
    },
    xssFilter: true,     // Enable X-XSS-Protection header
    noSniff: true,      // Add noSniff middleware to prevent MIME-type sniffing
    ieNoOpen: true,     // Set X-Download-Options to noopen
    hsts: {              // Enable and configure HSTS
        maxAge: 90 * 24 * 60 * 60,
        force: true
    },
    dnsPrefetchControl: false, // Disable DNS prefetching
    noCache: true,      // Enable noCache
    contentSecurityPolicy: false,
}));

// Use cookie-parser middleware
app.use(cookieParser());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cors(index.corsOptions));

app.get('/', (req, res) => {
    const data = { title: 'Coretify - Fast Auth Setup Application', message: 'Hello, Coretify!' };
    res.render('index', data);  // Render the index.ejs view
});

app.use('/admin', admin);
app.use('/demo', demo);
app.use('/register', register);
app.use('/login', login);
app.use('/auth', auth);

app.listen(index.serverPort, () => {
    console.log(`Server is running at http://localhost:${index.serverPort}`);
});

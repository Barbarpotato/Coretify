# Coretify
Coretify is a centralized login account management system designed to simplify and secure user authentication processes across multiple applications. Built with Bun for high-performance server-side JavaScript execution and Express for routing and middleware management, Coretify ensures efficient handling of API requests. The project leverages JWT (JSON Web Tokens) to implement secure and stateless authentication, making it easy for users to log in and manage their accounts across various services. Coretify aims to be a robust, scalable, and secure solution for centralized user account management.

# Installation & Setup
Coretify is built using Bun, so you need to install it first. Visit the <a href="https://bun.sh/">Bun website</a> for installation instructions. After installation, verify that Bun is installed by running:
```bash
bun --version
bun install
```

Create a .env file in the project’s root directory and define the required environment variables. here is the requirement env variables that you need:
```.env
JWT_SECRET_ADMIN=VALUES
JWT_SECRET=VALUES
ADMIN_USERNAME=VALUES
ADMIN_PASSWORD=VALUES
REDIS_HOST=VALUES
REDIS_PASSWORD=VALUES
REDIS_PORT=VALUES
DATABASE_URL=VALUES
```
The .env file for Coretify defines critical environment variables to ensure secure and efficient functionality. It includes two JWT secrets—JWT_SECRET_ADMIN for admin-level actions like creating users or applications, and JWT_SECRET for authenticating regular users. Admin credentials (ADMIN_USERNAME and ADMIN_PASSWORD) provide access to administrative operations. Redis configurations (REDIS_HOST, REDIS_PASSWORD, REDIS_PORT) support caching and rate-limiting, while DATABASE_URL specifies the MySQL connection string for Coretify’s database, ensuring secure communication via SSL. This setup maintains a clear separation of privileges and integrates external services seamlessly for scalability and security.

# Mysql Support
Coretify currently supports MySQL as the database system. The database schema is managed using Prisma, which provides a structured and flexible way to interact with the database. You are free to modify and extend the database architecture as needed for your specific use case. The current architecture consists of four main models: User, Application, UserApplication and SignupKey
```prisma
model User {
  id         Int      @id @default(autoincrement())
  username   String   @unique
  password   String // Store hashed password
  is_active  Boolean  @default(true) // Active/Inactive status
  created_at DateTime @default(now())
  updated_at DateTime @default(now()) @updatedAt

  applications UserApplication[]
}
```

```prisma
model Application {
  id         Int      @id @default(autoincrement())
  app_id     String   @unique
  app_name   String
  app_type   String
  app_url    String
  created_at DateTime @default(now())
  updated_at DateTime @default(now()) @updatedAt

  user_applications UserApplication[]
}
```
Additionally, a user table can be associated with multiple applications through the UserApplication model.

```prisma
model UserApplication {
  id             Int @id @default(autoincrement())
  user_id        Int
  application_id Int

  user        User        @relation(fields: [user_id], references: [id], onDelete: Cascade)
  application Application @relation(fields: [application_id], references: [id], onDelete: Cascade)
}

```
The signupKey is used to generate signup key token that can be use from the external resource to register their account. (Since the user registration handled by the Admin by default)
```prisma
model SignupKey {
  id        Int       @id @default(autoincrement())
  key       String    @unique
  createdAt DateTime  @default(now())
  usedAt    DateTime?
}

```
This model creates a link between users and applications, allowing Coretify to track which users are associated with which applications. Both user_id and application_id are tied to their respective records, and if either a user or application is deleted, the related records in UserApplication are also removed (onDelete: Cascade).

This structure allows for efficient user and application management, with clear relationships between users and the applications they can access. The use of Prisma ensures that the database schema can be easily modified as needed to accommodate future requirements.

# Coretify Rate Limiter Configuration
The rate limiter configuration ensures that API endpoints are protected from excessive or malicious requests while leveraging Redis for scalability. This rate-limiter feature is optional. in `coretify.config.js` you can setup the `useRateLimit` to `false` or `true`.

the rate limiter in corefity only support `redis` to store the key-value pair of inbound ip address to the server. You can find the redis configuration in `cache.config.js` file. If you dont want to use redis, You can also modified `cache.config.js` and `limiter function` in `routes/middleware.js` file to a custom value where the key-value is store.

# Docker Intallation Setup
You can also install the docker image for this project instead cloning the repo from this link : <a href="https://hub.docker.com/r/darmajr94/coretify" target="_blank">darmajr94/coretify</a>

After installing the image of this coretify project you can setup the docker-compose file and running trough this docker-compose. You can actually modified the environment variable value trough this docker-compose as you needed:
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:5.7
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: coretify
    ports:
      - "3301:3306"
      
  redis:
    image: redis:latest
    restart: always
    ports:
      - "6379:6379"
    environment:
      REDIS_PASSWORD: "root"  # Set Redis password
    command: redis-server --requirepass root  # Redis will require this password
    volumes:
      - redis-data:/data  # Persist Redis data in a Docker volume

  app:
    image: darmajr94/coretify
    ports:
      - "3000:3000"
    environment:
      ADMIN_USERNAME: admin
      ADMIN_PASSWORD: root
      JWT_SECRET_ADMIN: admin_root
      JWT_SECRET: root
      DATABASE_URL: mysql://root:root@mysql:3306/coretify
      REDIS_HOST: redis  # Use Redis service name as hostname
      REDIS_PORT: 6379   # Default Redis port
      REDIS_PASSWORD: root  # Redis password
    depends_on:
      - mysql
      - redis
    command: >
      sh -c "
      npx prisma migrate deploy &&
      npm run start"

volumes:
  redis-data:
    driver: local

```

# Coretify Configuration
The configuration for Coretify is managed through a single file that streamlines the bundling process and environment variable management. Below is an overview of the main components of the configuration file:
- serverPort: Specifies the port on which the server will run. By default, it is set to 3000.
- jwtSecretAdmin: This retrieves the admin JWT secret from the environment variables, ensuring that administrative actions are protected with a secure token.
- jwtSecret: This retrieves the regular user JWT secret from the environment variables, allowing for secure user authentication.
- corsOptions: This section configures Cross-Origin Resource Sharing (CORS) settings, which define how your server interacts with requests from different origins. Key components include:
- origin: A function that specifies which origins are allowed to access the server. Currently, it is set to allow all origins (callback(null, true)).
- allowedHeaders: Specifies which headers can be included in requests. This includes Content-Type and Authorization, essential for handling requests with JSON data and token-based authentication.
- maxAge: Defines the duration (in seconds) that the CORS preflight request can be cached. In this configuration, it is set to 120 seconds (or 2 minutes).
- Rate Limiting: The useRateLimit option is enabled (true) to enforce limits on the number of requests a client can make, helping prevent abuse or overloading the server (only support redis cache).

This configuration file plays a crucial role in ensuring that Coretify operates securely and efficiently, making it easy to manage settings and sensitive information in one place

# API Public Documentations
You can access the public API documentation trough the <a href="https://coretify.vercel.app/documentations" target="_blank">Coretify</a> Website. Supported by Swagger UI API for easy human readable Documentations and
Suppport API Endpoint Execution and Demonstration.

# Authentication API

This document outlines the API for user authentication using JWT tokens in the Express application.

## Authentication Route

| Method | Endpoint | Request Body                          | Response Body                             | Description                               |
|--------|----------|---------------------------------------|-------------------------------------------|-------------------------------------------|
| POST   | `/auth`  | `{ "token": "<JWT_TOKEN>" }`         | `{"message": "Token is valid", "user": { ... }}` or `{"message": "Invalid credentials"}` or `{"message": "Invalid token"}` | Validates the provided JWT token. If valid, returns user information; otherwise returns an error message. |

### Request Body

- `token` (string): The JWT token that needs to be validated.

### Response Body

- **Success (200)**:
  - `message`: Confirmation that the token is valid.
  - `user`: Contains user information decoded from the token.

- **Invalid Credentials (401)**:
  - `message`: "Invalid credentials" when no token is provided.

- **Invalid Token (403)**:
  - `message`: "Invalid token" when the provided token cannot be verified.

## Usage Example

To authenticate a user, send a POST request to `/auth` with the JWT token in the request body:

```bash
curl -X POST http://<your-server>/auth -H "Content-Type: application/json" -d '{"token": "<JWT_TOKEN>"}'
```

# Login API

This document outlines the API for user login in the Express application, supporting both admin and client logins.

## Login Routes

### Admin Login

| Method | Endpoint     | Request Body                       | Response Body                                | Description                                              |
|--------|--------------|------------------------------------|----------------------------------------------|----------------------------------------------------------|
| GET    | `/login/admin` | N/A                                | Renders the login page for admin.           | Serves the admin login page (EJS template).            |
| POST   | `/login/admin` | `{ "username": "<ADMIN_USERNAME>", "password": "<ADMIN_PASSWORD>" }` | `{"status": "ok", "token": "<JWT_TOKEN>"}` or `{"message": "Invalid credentials"}` | Validates admin credentials. Returns a JWT token if valid. |

### Client Login

| Method | Endpoint         | Request Body                                                                                             | Response Body                                                                                                | Description                                               |
|--------|------------------|---------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| POST   | `/login/client`   | `{ "username": "<USERNAME>", "password": "<PASSWORD>", "app_token": "<APPLICATION_TOKEN>" }`             | `{"status": "ok", "token": "<JWT_TOKEN>", "application_token": "<APPLICATION_ID>"}` or `{"error": "Invalid Parameters"}` | Logs in the client user and returns a JWT and application token. |

## Request Body

### Admin Login
- `username` (string): The username for the admin.
- `password` (string): The password for the admin.

### Client Login
- `username` (string): The username for the client account.
- `password` (string): The password for the client account.
- `app_token` (string): The application token representing the client's access to a specific application.

## Response Body

### Admin Login
- **Success (200)**:
  - `status`: "ok"
  - `token`: The JWT token for the admin session.

- **Invalid Credentials (401)**:
  - `message`: "Invalid credentials" when username or password is incorrect.

### Client Login
- **Success (200)**:
  - `status`: "ok"
  - `token`: The JWT token for the authenticated session.
  - `application_token`: The `app_id` associated with the user's application.

- **User Not Active (401)**:
  - `message`: "User is not active" when the user account is inactive.

- **Invalid Credentials (401)**:
  - `message`: "Invalid credentials" when username or password is incorrect.

## Usage Examples

### Admin Login

To log in as an admin, send a POST request to `/login/admin`:

```bash
curl -X POST http://<your-server>/login/admin -H "Content-Type: application/json" -d '{"username": "<ADMIN_USERNAME>", "password": "<ADMIN_PASSWORD>"}'
```

# Registration API

This document outlines the API for user and application registration in the Express application.
There are 2 types of user registration:
- Admin-level registration
  - This type of registration is handled by Admin itself. The admin will create username and its password to the responsible user.
- External-level registration
  - This type of registration is handled by external resource (User). which means the Admin will generate the signup key and the signup key will be used by user to register their account (in this case, the user can freely pick the username and password as they want).

## Registration Routes

### Application Registration

| Method | Endpoint         | Request Body                                          | Response Body                                   | Description                                          |
|--------|------------------|------------------------------------------------------|------------------------------------------------|------------------------------------------------------|
| POST   | `/register/application` | `{ "app_name": "<APPLICATION_NAME>", "app_type": "<APPLICATION_TYPE>", "app_url": "<APPLICATION_URL>" }` | `{"message": "Application registered successfully"}` or `{"error": "All fields are required"}` | Registers a new application with the provided details. |

### User Registration

| Method | Endpoint         | Request Body                                | Response Body                                   | Description                                          |
|--------|------------------|---------------------------------------------|------------------------------------------------|------------------------------------------------------|
| POST   | `/register/user`  | `{ "username": "<USERNAME>", "password": "<PASSWORD>" }` | `{"message": "User registered successfully"}` or `{"error": "Username and password are required"}` or `{"error": "Username already exists"}` | Registers a new user account with the provided username and password. |

### Signup Registration

| Method | Endpoint         | Request Body                                               | Response Body                                           | Description                                                 |
|--------|------------------|------------------------------------------------------------|--------------------------------------------------------|-------------------------------------------------------------|
| POST   | `/register/signup` | `{ "username": "<USERNAME>", "password": "<PASSWORD>", "signup_key": "<SIGNUP_KEY>" }` | `{"message": "User registered successfully"}` or `{"error": "Invalid Signup Key"}` | Registers a new user account with a signup key and password. |

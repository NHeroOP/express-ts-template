# Express.js + TypeScript Template

A robust starter template for building scalable backend applications using Express.js, TypeScript, and MongoDB. This template comes pre-configured with essential features like user authentication (local and Google OAuth), file uploads, and a structured, production-ready project layout.

## Features

- **TypeScript Ready:** Full TypeScript integration for type safety and improved developer experience.
- **User Authentication:**
    - Secure local registration and login using JWT (JSON Web Tokens).
    - Access and Refresh Token strategy for persistent sessions.
    - Password hashing with `bcrypt`.
    - Google OAuth 2.0 integration via Passport.js.
- **Database:** MongoDB with Mongoose ODM for elegant data modeling.
- **File Uploads:** Handles `multipart/form-data` with `multer` and integrates with Cloudinary for cloud storage.
- **Structured Project:** Organized and scalable folder structure.
- **Utilities:** Comes with helper classes and functions for consistent API responses (`ApiResponse`), error handling (`ApiError`), and async operations (`asyncHandler`).
- **Environment Configuration:** Uses `dotenv` for managing environment variables.
- **CORS:** Pre-configured CORS settings for frontend integration.

## Technologies Used

- **Backend Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB & Mongoose
- **Authentication:** `jsonwebtoken`, `passport`, `passport-google-oauth20`, `bcrypt`
- **File Handling:** `multer`, `cloudinary`
- **Development:** `tsx` for fast, on-the-fly TypeScript execution, `nodemon`

## Project Structure

```
.
├── public/temp/         # Temporary directory for file uploads
└── src/
    ├── @types/          # Custom TypeScript type definitions
    ├── config/          # Database connection, Passport.js strategy
    ├── controllers/     # Route handlers containing business logic
    ├── middlewares/     # Express middlewares (auth, file uploads)
    ├── models/          # Mongoose data models/schemas
    ├── routes/          # API route definitions
    └── utils/           # Reusable utility classes and functions
    ├── app.ts           # Express app configuration
    └── index.ts         # Main application entry point
├── .env.sample          # Environment variable template
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or another package manager
- A MongoDB instance (local or a cloud service like MongoDB Atlas)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/NHeroOP/express-ts-template.git
    cd express-ts-template
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory by copying the `.env.sample` file.
    ```bash
    cp .env.sample .env
    ```
    Then, fill in the values in the `.env` file:

    ```env
    # --- MongoDB ---
    MONGODB_URI=your_mongodb_connection_string

    # --- Server ---
    PORT=8000
    CORS_ORIGIN=http://localhost:3000

    # --- JWT Tokens ---
    ACCESS_TOKEN_SECRET=your_strong_access_token_secret
    ACCESS_TOKEN_EXPIRY=1d
    REFRESH_TOKEN_SECRET=your_strong_refresh_token_secret
    REFRESH_TOKEN_EXPIRY=10d

    # --- Cloudinary ---
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret

    # --- Google OAuth ---
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    # The callback URL must match the one in your Google Cloud Console credentials
    # Example: http://localhost:8000/api/v1/auth/google/callback
    GOOGLE_CALLBACK_URL=your_google_oauth_callback_url
    ```

### Running the Application

-   **Development Mode:**
    The server will automatically restart on file changes.
    ```bash
    npm run dev
    ```

-   **Production Mode:**
    This will build the TypeScript source into JavaScript in the `dist` folder and then start the server.
    ```bash
    npm run build
    npm start
    ```

## API Endpoints

All routes are prefixed with `/api/v1/auth`.

| Method | Endpoint              | Description                                                               | Protected |
| :----- | :-------------------- | :------------------------------------------------------------------------ | :-------- |
| `POST` | `/register`           | Register a new user with username, password, and avatar.                  | No        |
| `POST` | `/login`              | Log in a user with username/email and password.                           | No        |
| `POST` | `/logout`             | Log out the current user and clear tokens.                                | Yes       |
| `GET`  | `/google`             | Initiates the Google OAuth 2.0 authentication flow.                       | No        |
| `GET`  | `/google/callback`    | Callback URL for Google to redirect to after successful authentication.   | No        |

### Notes on Endpoint Usage

-   **Register:** Expects `multipart/form-data` with fields `username`, `email`, `fullName`, `password`, and a file `avatarUrl`.
-   **Login:** Expects `application/json` with `username` (or `email`) and `password`.
-   **Logout:** Requires a valid `accessToken` to be sent in cookies or as a Bearer token.
-   **Tokens:** After a successful login, `accessToken` and `refreshToken` are returned in the response body and set as `httpOnly`, `secure` cookies.
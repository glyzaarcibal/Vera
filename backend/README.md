# V.E.R.A. Backend

This is the backend server for **V.E.R.A. (Voice Emotion Recognition Application)**, a Capstone Thesis project.

For a full overview of the project, please see the [main README](../README.md).

## 🚀 Features

- **User Authentication**: Secure login and registration.
- **Session Management**: Tracking user interactions and mood history.
- **AI Integration**: Handling requests to AI models for Voice Emotion Recognition and Chat AI.
- **Email Services**: Sending verification emails and notifications.
- **Database Management**: Storing user profiles, reports, and activity logs.

## 🛠️ Technology Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose ODM)
- **AI Services**: Hugging Face (for Emotion Recognition), OpenAI or similar for Chat.
- **Deployment**: [Vercel](https://vercel.com/) (Serverless Functions support)

## 📦 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Environment Variables**:
   Create a `.env` file in this directory with the following variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `PORT`
   - `HF_TOKEN` (Hugging Face)
   - `EMAIL_USER`, `EMAIL_PASS` (for SMTP)

3. **Run the server**:
   ```bash
   node server.js
   ```
   Or for development:
   ```bash
   npm run dev
   ```

## 📂 Structure

- `controllers/`: Logic for handling API requests.
- `routes/`: Express route definitions.
- `service/`: Core business logic and external integrations.
- `config/`: Configuration for database, CORS, etc.
- `middleware/`: Authentication and error handling middleware.
- `utils/`: Common utilities and constants.

# Mini ERP CRM
A comprehensive Mini ERP and CRM application with a React (Vite) frontend and an Express (TypeScript) backend using Prisma for database management.
## Tech Stack
*   **Frontend:** React, Vite, TailwindCSS (or Vanilla CSS), Axios
*   **Backend:** Node.js, Express, TypeScript, Prisma ORM
*   **Database:** MySQL (Hosted on Aiven Cloud)
---
## 🛠️ Local Development Setup
Follow these instructions to run the project locally on your machine.
### Prerequisites
*   [Node.js](https://nodejs.org/) installed
*   A running MySQL database (or use the provided Aiven Cloud URL)
### 1. Backend Setup
Open a terminal and navigate to the `backend` directory:
```bash
cd backend
```
Install dependencies:
```bash
npm install
```
Set up Environment Variables:
Create a `.env` file in the `backend` directory and add the following:
```env
DATABASE_URL="mysql://avnadmin:YOUR_DB_PASSWORD@your-db-url:port/defaultdb?ssl-mode=REQUIRED"
JWT_SECRET="your_super_secret_jwt_key_here"
PORT=5000
```
Generate Prisma Client & Sync Database:
```bash
npx prisma generate
npx prisma db push
```
Start the backend server (Development mode):
```bash
npm run dev
```
*The backend should now be running on `http://localhost:5000`*
### 2. Frontend Setup
Open a new terminal window and navigate to the `frontend` directory:
```bash
cd frontend
```
Install dependencies:
```bash
npm install
```
Set up Environment Variables:
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL="http://localhost:5000/api"
```
Start the frontend server (Development mode):
```bash
npm run dev
```
*The frontend should now be running on `http://localhost:5173` (or similar).*
---
## 🚀 Deployment Instructions
### Backend Deployment (e.g., Render, Heroku)
1. Connect your GitHub repository to your hosting platform.
2. Ensure your Root Directory is set to `backend` (if supported by your platform), otherwise configure the commands to run inside the `backend` folder.
3. Configure the following deployment settings:
    *   **Build Command:** `npm install && npm run build`
    *   **Start Command:** `npm start`
4. Add the following **Environment Variables** in your platform's dashboard:
    *   `DATABASE_URL`: Your production MySQL URL.
    *   `JWT_SECRET`: A secure random string for authentication.
### Frontend Deployment (e.g., Vercel, Netlify)
1. Connect your GitHub repository to Vercel/Netlify.
2. Set the Root Directory to `frontend`.
3. The platform should automatically detect Vite and set the correct build settings:
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`
4. Add the following **Environment Variable** in your platform's dashboard:
    *   `VITE_API_URL`: The live URL of your deployed backend (e.g., `https://your-backend.onrender.com/api`).

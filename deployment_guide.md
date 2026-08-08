# Monorepo Deployment Guide: InterviewAI

This document provides instructions for deploying the **InterviewAI** SaaS application to production.

---

## 1. Architecture Overview

```
                        [ Candidate Client (React SPA) ]
                                | (Vite/Vercel)
                                |
                                v
                   [ API Backend (Node.js/Express) ]
                                | (Render / AWS)
                                |
       +------------------------+------------------------+
       |                                                 |
       v                                                 v
[ MongoDB Atlas ]                                [ Python NLP Service ]
 (Database Cloud)                                (FastAPI / Render)
```

---

## 2. Frontend Deployment (Vercel)

Vercel is recommended for hosting the React frontend due to its edge delivery network and SPA integration.

### Steps:
1. Connect your Github Repository to Vercel.
2. Select the `frontend` folder as the Root Directory.
3. Configure Build Settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the Environment Variables:
   - `VITE_API_URL`: The URL of your deployed Express API (e.g., `https://api.interviewai.com`).
5. Trigger build. The `vercel.json` file inside the directory ensures all paths redirect correctly to `index.html` to support client-side React Router navigation.

---

## 3. Backend Deployment (Render or AWS)

The backend is a Node.js Express server communicating with MongoDB Atlas and the Python microservice.

### Steps:
1. Create a new **Web Service** on Render.
2. Select the root directory and configure path parameters:
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build` (transpiles TypeScript to `dist/`)
   - **Start Command**: `npm run start` (runs `node dist/src/server.js`)
3. Add the following Environment Variables in Render's configuration panel:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production compiler settings |
| `PORT` | `5000` | Port for Express to bind |
| `MONGO_URI` | `mongodb+srv://...` | Secure MongoDB Atlas connection URI |
| `JWT_SECRET` | `your-high-entropy-jwt-secret-string` | Secret key for auth token signups |
| `CLIENT_URL` | `https://your-frontend.vercel.app` | CORS allowance targeting the frontend domain |
| `PYTHON_SERVICE_URL`| `https://your-python-service.onrender.com` | Host endpoint of the FastAPI NLP microservice |
| `GEMINI_API_KEY` | `AIzaSy...` | Google AI Studio Gemini API Key |
| `CLOUDINARY_CLOUD_NAME`| `your-cloud-name` | Cloudinary Storage Account name |
| `CLOUDINARY_API_KEY` | `your-api-key` | Cloudinary API Key credential |
| `CLOUDINARY_API_SECRET`| `your-api-secret` | Cloudinary API Secret credential |

---

## 4. Python NLP Microservice (Render or AWS)

The NLP service runs FastAPI and uses `sentence-transformers` and `spaCy`. Because NLP models are heavy, optimizing startup is critical.

### Steps:
1. Create a new **Web Service** on Render.
2. Configure path settings:
   - **Root Directory**: `python-service`
   - **Build Command**: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. **Model Caching (Crucial Optimization)**:
   - By default, `sentence-transformers` downloads the embedding model on every container boot. This adds 30-60 seconds of latency and can trigger Render deployment timeout aborts.
   - **Solution**: Set the environment variable `HF_HOME` or `TRANSFORMERS_CACHE` pointing to a persistent disk path (e.g. `/data/huggingface`) or download the model explicitly during the build step.
   - Alternatively, add model downloads to a custom pre-build script so Render caches the dependencies inside the build image.

---

## 5. Database Setup (MongoDB Atlas)

Ensure your MongoDB instance is ready for production traffic:
1. **IP Whitelisting**: Ensure your database allows access from the server hosts (Render provides static outbound IP addresses if you request them, or you can whitelist `0.0.0.0/0` with high-complexity database passwords).
2. **Database Indices**:
   - The application automatically ensures schemas setup key indexes (e.g. `user` and rotated `token` parameters).
   - Ensure the rotated `Session` TTL index is running:
     - `expiresAfterSeconds` configured to `604800` (7 days) on the `createdAt` field inside your database collection.

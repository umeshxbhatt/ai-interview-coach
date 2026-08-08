# InterviewAI: AI-Powered Interview Preparation SaaS

InterviewAI is an enterprise-grade SaaS application designed to help users prepare for technical and behavioral interviews using Large Language Models (LLMs) and semantic natural language processing.

## Architecture Overview

The project is structured as a monorepo consisting of:
1. **Frontend (`/frontend`)**: A React 19 + TypeScript SPA built with Vite. It incorporates modern state management (Zustand), styling (Tailwind CSS, Shadcn UI, Framer Motion), data fetching (TanStack Query), and robust forms (React Hook Form, Zod).
2. **Backend (`/backend`)**: A Node.js + Express + TypeScript service built following the **Repository & Service Layer Pattern**. It handles JWT-based authentication (secure cookie-based access & rotated refresh tokens), session management, file uploads (Multer + Cloudinary), database interaction (MongoDB + Mongoose), and security configurations (Helmet, rate limits, CORS).
3. **Python Service (`/python-service`)**: A FastAPI service utilizing `scikit-learn`, `spaCy`, and `sentence-transformers`. It handles heavy text processing tasks, such as extracting target keywords from resumes, calculating semantic similarity scores between candidate responses and ideal answers, and calibrating resume matches.

---

## Directory Structure

```
interview-ai/
├── backend/                  # Node.js + Express TypeScript backend
│   ├── src/
│   │   ├── config/           # Database, Cloudinary, Gemini connections
│   │   ├── controllers/      # Route handlers
│   │   ├── events/           # Pub/Sub or Event Emitters
│   │   ├── jobs/             # Scheduled cron jobs (e.g. session cleanup)
│   │   ├── middleware/       # Auth, rate-limiters, validation, error-handlers
│   │   ├── models/           # Mongoose schemas (User, Interview, Report, etc.)
│   │   ├── repositories/     # Data Access layer (Direct Mongoose queries)
│   │   ├── routes/           # Router groups (auth, interviews, resume, etc.)
│   │   ├── services/         # Business logic layer (orchestrates repositories/AI)
│   │   ├── utils/            # Cryptography, helpers, HTTP errors
│   │   ├── validators/       # Request schemas (Zod backend validation)
│   │   ├── app.ts            # Express app assembly
│   │   └── server.ts         # Port entry & database connectivity
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                 # React 19 + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/       # Global reusable UI components (Buttons, Inputs, layout)
│   │   ├── features/         # Feature-based logic (auth, dashboard, interview-engine)
│   │   ├── hooks/            # Global custom hooks
│   │   ├── lib/              # Library clients (Axios instance, React Query client)
│   │   ├── pages/            # Page templates & routing targets
│   │   ├── services/         # API request wrappers
│   │   ├── store/            # Zustand global stores
│   │   ├── types/            # Global TypeScript definitions
│   │   ├── utils/            # Formatters, animations, styles
│   │   ├── App.tsx           # App shell & router mounts
│   │   └── main.tsx          # React render mount
│   ├── tsconfig.json
│   └── package.json
│
└── python-service/           # FastAPI semantic scoring service
    ├── main.py               # FastAPI router and core endpoint definitions
    ├── requirements.txt      # Python dependencies
    └── venv/                 # Virtual environment
```

---

## Setup & Running Locally

1. **Bootstrap Workspace Dependencies**:
   ```bash
   npm install
   npm run bootstrap
   ```

2. **Configure Environment Variables**:
   Follow instructions in:
   - `backend/.env.example`

3. **Configure Python Service**:
   ```bash
   cd python-service
   python -m venv venv
   venv\Scripts\activate      # Windows
   # source venv/bin/activate # macOS/Linux
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   ```

4. **Launch All Services Concurrently**:
   ```bash
   npm run dev
   ```
# InterviewAI

An AI-powered interview preparation platform built using the MERN stack and Python.

## Features

- AI mock interviews
- Resume analysis
- Personalized feedback
- Analytics dashboard
- JWT Authentication
- MongoDB
- Gemini AI

## Tech Stack

- React
- TypeScript
- TailwindCSS
- Node.js
- Express
- MongoDB
- FastAPI
- Gemini API

## Status

🚧 Currently under development.
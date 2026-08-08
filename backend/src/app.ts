import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/environment';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { NotFoundError } from './utils/httpErrors';

const app: Application = express();

// Security Middlewares
app.use(helmet());

// CORS configuration (Supporting secure HttpOnly cookies)
const allowedOrigins = [
  'http://localhost:5173', // Vite standard dev port
  'http://localhost:3000',
  process.env.FRONTEND_URL, // Production Frontend URL
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiting (Prevent DDoS/Brute-force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to X requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', limiter);

// Mount API Routing
app.use('/api', apiRouter);

// Fallback for unhandled paths (404)
app.use('*', (req, res, next) => {
  next(new NotFoundError(`Cannot find path ${req.originalUrl} on this server`));
});

// Centralized Global Error Handler
app.use(errorHandler);

export default app;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { env } from './config/env';
import { apiLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());

const allowedOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:8081', 'http://localhost:3000', 'http://localhost:4000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow mobile apps, curl, Postman (requests with no origin header)
      if (!origin) return callback(null, true);
      if (env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));

app.use('/api', apiLimiter, routes);

app.use(errorHandler);

export default app;

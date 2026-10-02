import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors({ origin: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));

app.use('/api', routes);

app.use(errorHandler);

export default app;


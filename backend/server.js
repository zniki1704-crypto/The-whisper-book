import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import storyRoutes from './routes/story.routes.js';
import metaRoutes from './routes/index.routes.js';
import { errorHandler } from './middleware/error.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:4200', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api', limiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'whisperbook' }));
app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api', metaRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`WhisperBook API running on port ${PORT}`));

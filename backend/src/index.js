import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import configs & routes
import db, { queryGet } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import donationRoutes from './routes/donationRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ESM absolute paths helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Dynamic uploads serving from database (persistent storage)
app.get('/uploads/:filename', async (req, res, next) => {
  try {
    const { filename } = req.params;
    const file = await queryGet('SELECT mimetype, data FROM uploads WHERE filename = $1', [filename]);
    if (!file) {
      return next(); // Fallback to local filesystem static serving
    }
    res.setHeader('Content-Type', file.mimetype);
    res.send(file.data);
  } catch (err) {
    console.error('Error serving upload from DB:', err);
    res.status(500).send('Internal server error');
  }
});

// Static directories mapping
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes mounting
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/donations', donationRoutes);

// Base route for server health check
app.get('/api/health', async (req, res) => {
  try {
    await queryGet('SELECT 1');
    res.status(200).json({ status: 'healthy', database: 'postgresql', connection: 'active' });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', database: 'postgresql', connection: 'failed', error: err.message });
  }
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Express Error Handler:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(` Sabeel Management Server running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`===================================================`);
});

export default app;

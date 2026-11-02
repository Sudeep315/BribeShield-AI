import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes.js';
import complaintRoutes from './routes/complaint.routes.js';
import evidenceRoutes from './routes/evidence.routes.js';
import auditRoutes from './routes/audit.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import externalRoutes from './routes/external.routes.js';
import suspectRoutes from './routes/suspect.routes.js';
import advisoryRoutes from './routes/advisory.routes.js';
import { notificationService } from './services/notification.service.js';
import { config } from './config/index.js';

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Cross-Origin Resource Sharing
app.use(cors({
  origin: [config.clientUrl, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key', 'X-BribeShield-Signature', 'x-admin-key']
}));

// Body Parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Health Check & System Status
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'BribeShield AI Enterprise API',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Real-Time Server-Sent Events (SSE) Push Notifications
app.get('/api/v1/notifications/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const unregister = notificationService.registerPushClient(res);
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Push stream active' })}\n\n`);

  req.on('close', () => {
    unregister();
  });
});

// Mount Modern REST Endpoints (/api/v1/...)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/evidence', evidenceRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/external', externalRoutes);
app.use('/api/v1/suspects', suspectRoutes);
app.use('/api/v1', advisoryRoutes);

// Mount Legacy / Original Routes for full compatibility (/api/...)
app.use('/api/complaints', complaintRoutes);
app.use('/api/suspects', suspectRoutes);
app.use('/api', advisoryRoutes);

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found on BribeShield AI: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

export default app;

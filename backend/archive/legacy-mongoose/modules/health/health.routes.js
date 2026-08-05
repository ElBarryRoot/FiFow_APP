import { Router } from 'express';
import mongoose from 'mongoose';
import { successResponse } from '../../utils/apiResponse.js';

const router = Router();

router.get('/', (req, res) => {
  return successResponse(res, {
    message: 'Fi Fow API opérationnelle.',
    data: {
      status: 'UP',
      requestId: req.requestId,
      uptime: process.uptime(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    }
  });
});

export default router;

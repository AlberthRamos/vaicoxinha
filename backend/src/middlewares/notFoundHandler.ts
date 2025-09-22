import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  logger.warn(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    error: {
      message: 'Rota não encontrada',
      code: 'ROUTE_NOT_FOUND',
      path: req.originalUrl,
      method: req.method,
    },
    timestamp: new Date().toISOString(),
  });
};
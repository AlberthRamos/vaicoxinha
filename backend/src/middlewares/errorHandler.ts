import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/AppError';

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Erro interno do servidor';
  let code = 'INTERNAL_SERVER_ERROR';

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
  }

  // Log do erro
  logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      code,
      statusCode,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      ip: req.ip,
    },
  });

  // Não expor detalhes de erro em produção
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(statusCode).json({
    error: {
      message,
      code,
      ...(isDevelopment && { stack: error.stack }),
      ...(isDevelopment && { details: error.message }),
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  });
};
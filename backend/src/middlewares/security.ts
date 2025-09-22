import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/AppError';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

// Configurações de segurança
const SECURITY_CONFIG = {
  // Rate limiting
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100, // máximo 100 requisições por IP
  loginAttempts: 5, // máximo 5 tentativas de login
  loginWindowMs: 15 * 60 * 1000, // 15 minutos
  
  // CORS
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://vai-coxinha.com',
    'https://www.vai-coxinha.com',
  ],
  
  // Headers de segurança
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  
  // Configurações de sessão
  sessionSecret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  sessionMaxAge: 24 * 60 * 60 * 1000, // 24 horas
};

// Middleware de logging detalhado
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  
  // Adicionar request ID ao request
  req.headers['x-request-id'] = requestId;
  
  // Log da requisição
  logger.info('Requisição recebida', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });
  
  // Interceptar resposta para log
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    
    logger.info('Resposta enviada', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      timestamp: new Date().toISOString(),
    });
    
    // Log de erros
    if (res.statusCode >= 400) {
      logger.error('Erro na resposta', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        body: body,
        duration: `${duration}ms`,
      });
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

// Middleware de monitoramento de performance
export const performanceMonitor = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] as string;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const performanceData = {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
    };
    
    // Alerta de performance lenta
    if (duration > 1000) {
      logger.warn('Requisição lenta detectada', performanceData);
    }
    
    // Métricas para monitoramento (poderia ser enviado para um serviço de métricas)
    if (typeof process.send === 'function') {
      process.send({
        type: 'performance_metric',
        data: performanceData,
      });
    }
  });
  
  next();
};

// Middleware de validação de entrada
export const inputValidation = (req: Request, res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi, // Scripts
    /javascript:/gi, // JavaScript URLs
    /on\w+\s*=/gi, // Event handlers
    /data:text\/html/gi, // Data URLs
    /vbscript:/gi, // VBScript
    /file:/gi, // File URLs
  ];
  
  const checkInput = (input: any): boolean => {
    if (typeof input !== 'string') return false;
    
    return suspiciousPatterns.some(pattern => pattern.test(input));
  };
  
  const scanObject = (obj: any): string[] => {
    const issues: string[] = [];
    
    const scan = (value: any, path: string) => {
      if (typeof value === 'string' && checkInput(value)) {
        issues.push(`Possível XSS detectado em ${path}`);
      } else if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach(key => {
          scan(value[key], `${path}.${key}`);
        });
      }
    };
    
    if (obj) {
      Object.keys(obj).forEach(key => {
        scan(obj[key], key);
      });
    }
    
    return issues;
  };
  
  // Verificar todos os inputs
  const issues = [
    ...scanObject(req.body),
    ...scanObject(req.query),
    ...scanObject(req.params),
  ];
  
  if (issues.length > 0) {
    logger.warn('Possível ataque XSS detectado', {
      issues,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
    });
    
    return next(new AppError('Entrada inválida detectada', 400));
  }
  
  next();
};

// Middleware de rate limiting personalizado
export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
} = {}) => {
  return rateLimit({
    windowMs: options.windowMs || SECURITY_CONFIG.windowMs,
    max: options.max || SECURITY_CONFIG.maxRequests,
    message: options.message || 'Muitas requisições deste IP, tente novamente mais tarde.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    handler: (req, res) => {
      logger.warn('Rate limit excedido', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });
      
      res.status(429).json({
        error: 'Too Many Requests',
        message: options.message || 'Muitas requisições deste IP, tente novamente mais tarde.',
        retryAfter: res.getHeader('Retry-After'),
      });
    },
  });
};

// Rate limit específico para login
export const loginRateLimiter = createRateLimiter({
  windowMs: SECURITY_CONFIG.loginWindowMs,
  max: SECURITY_CONFIG.loginAttempts,
  message: 'Muitas tentativas de login, tente novamente em 15 minutos.',
  skipSuccessfulRequests: true,
});

// Middleware de CORS configurado
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (SECURITY_CONFIG.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('Tentativa de acesso de origem não permitida', {
        origin,
        timestamp: new Date().toISOString(),
      });
      callback(new AppError('Acesso não permitido desta origem', 403));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
});

// Middleware de segurança com Helmet
export const securityHeaders = helmet({
  contentSecurityPolicy: SECURITY_CONFIG.contentSecurityPolicy,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: true },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'same-origin' },
  xssFilter: true,
});

// Middleware de autenticação de API Key
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.API_KEY;
  
  if (!validApiKey) {
    return next(new AppError('API Key não configurada', 500));
  }
  
  if (!apiKey || apiKey !== validApiKey) {
    logger.warn('Tentativa de acesso com API Key inválida', {
      providedKey: apiKey ? 'presente' : 'ausente',
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    
    return next(new AppError('API Key inválida', 401));
  }
  
  next();
};

// Middleware de validação de webhook
export const webhookValidation = (req: Request, res: Response, next: NextFunction): void => {
  const signature = req.headers['x-signature'] as string;
  const timestamp = req.headers['x-timestamp'] as string;
  
  if (!signature || !timestamp) {
    return next(new AppError('Assinatura do webhook ausente', 401));
  }
  
  // Validar timestamp (evitar replay attacks)
  const currentTime = Math.floor(Date.now() / 1000);
  const webhookTime = parseInt(timestamp);
  const timeDiff = Math.abs(currentTime - webhookTime);
  
  if (timeDiff > 300) { // 5 minutos de tolerância
    return next(new AppError('Timestamp do webhook inválido', 401));
  }
  
  // Validar assinatura (implementar baseado no serviço)
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (webhookSecret) {
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      logger.warn('Assinatura de webhook inválida', {
        expectedSignature,
        receivedSignature: signature,
        timestamp,
        ip: req.ip,
      });
      
      return next(new AppError('Assinatura do webhook inválida', 401));
    }
  }
  
  next();
};

// Middleware de sanitização de dados sensíveis
export const sanitizeSensitiveData = (req: Request, res: Response, next: NextFunction): void => {
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'creditCard',
    'cvv',
    'pin',
  ];
  
  const sanitize = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    const sanitized = { ...obj };
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitize(sanitized[key]);
      }
    });
    
    return sanitized;
  };
  
  // Sanitizar logs
  const originalLog = console.log;
  console.log = (...args) => {
    const sanitizedArgs = args.map(arg => 
      typeof arg === 'object' ? sanitize(arg) : arg
    );
    originalLog(...sanitizedArgs);
  };
  
  // Sanitizar request body para logs
  req.sanitizedBody = sanitize(req.body);
  
  next();
};

// Middleware de detecção de bots
export const botDetection = (req: Request, res: Response, next: NextFunction): void => {
  const userAgent = req.get('User-Agent') || '';
  const botPatterns = [
    /bot/i,
    /spider/i,
    /crawler/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
  ];
  
  const isBot = botPatterns.some(pattern => pattern.test(userAgent));
  
  if (isBot) {
    logger.info('Bot detectado', {
      userAgent,
      ip: req.ip,
      url: req.url,
      timestamp: new Date().toISOString(),
    });
    
    // Adicionar header para indicar que é um bot
    res.setHeader('X-Bot-Detected', 'true');
  }
  
  next();
};

// Middleware de integridade de dados
export const dataIntegrity = (req: Request, res: Response, next: NextFunction): void => {
  const contentLength = req.get('Content-Length');
  const actualLength = JSON.stringify(req.body).length;
  
  if (contentLength && parseInt(contentLength) !== actualLength) {
    logger.warn('Tamanho do conteúdo não corresponde', {
      expected: contentLength,
      actual: actualLength,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    
    return next(new AppError('Integridade dos dados comprometida', 400));
  }
  
  next();
};

// Middleware de limpeza de cache
export const cacheControl = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
};

export default {
  requestLogger,
  performanceMonitor,
  inputValidation,
  createRateLimiter,
  loginRateLimiter,
  corsMiddleware,
  securityHeaders,
  apiKeyAuth,
  webhookValidation,
  sanitizeSensitiveData,
  botDetection,
  dataIntegrity,
  cacheControl,
  SECURITY_CONFIG,
};
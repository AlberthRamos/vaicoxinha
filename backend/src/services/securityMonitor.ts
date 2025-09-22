import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { monitoringService } from '@/services/monitoringService';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { body, validationResult } from 'express-validator';

// Interfaces para tipos de segurança
interface SecurityEvent {
  type: 'attack' | 'suspicious' | 'blocked' | 'warning';
  category: 'sql_injection' | 'xss' | 'brute_force' | 'ddos' | 'bot' | 'data_exposure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details: Record<string, any>;
  request?: {
    ip: string;
    userAgent: string;
    method: string;
    url: string;
    headers: Record<string, string>;
  };
}

interface RateLimitRule {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
  handler?: (req: Request, res: Response) => void;
}

// Classe principal de segurança
export class SecurityMonitor {
  private blockedIPs: Set<string> = new Set();
  private suspiciousActivities: Map<string, number> = new Map();
  private readonly MAX_SUSPICIOUS_ACTIVITIES = 5;
  private readonly BLOCK_DURATION = 15 * 60 * 1000; // 15 minutos

  constructor() {
    this.loadBlockedIPs();
  }

  // Carregar IPs bloqueados do banco de dados
  private async loadBlockedIPs(): Promise<void> {
    try {
      // Implementar carregamento de IPs bloqueados do banco
      logger.info('IPs bloqueados carregados');
    } catch (error) {
      logger.error('Erro ao carregar IPs bloqueados', { error });
    }
  }

  // Registrar evento de segurança
  private logSecurityEvent(event: SecurityEvent): void {
    const logData = {
      ...event,
      timestamp: new Date(),
      request: event.request || {
        ip: 'unknown',
        userAgent: 'unknown',
        method: 'unknown',
        url: 'unknown',
        headers: {},
      },
    };

    // Log no sistema de logs
    logger.warn('Evento de segurança detectado', logData);

    // Criar alerta no sistema de monitoramento
    monitoringService.createAlert({
      level: event.severity === 'critical' ? 'critical' : 
             event.severity === 'high' ? 'error' : 
             event.severity === 'medium' ? 'warning' : 'info',
      title: `Segurança: ${event.category}`,
      description: `Atividade ${event.type} detectada: ${event.category}`,
      source: 'security_monitor',
      metadata: logData,
    });

    // Registrar métrica
    monitoringService.recordMetric(`security.${event.category}`, 1, {
      type: event.type,
      severity: event.severity,
    });
  }

  // Bloquear IP suspeito
  private blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip);
    
    // Programar desbloqueio automático
    setTimeout(() => {
      this.blockedIPs.delete(ip);
      logger.info('IP desbloqueado automaticamente', { ip });
    }, this.BLOCK_DURATION);

    this.logSecurityEvent({
      type: 'blocked',
      category: 'brute_force',
      severity: 'high',
      source: 'ip_block',
      details: { ip, reason, duration: this.BLOCK_DURATION },
    });

    logger.warn('IP bloqueado por segurança', { ip, reason });
  }

  // Verificar se IP está bloqueado
  isBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  // Detectar atividade suspeita
  private detectSuspiciousActivity(req: Request, category: SecurityEvent['category'], details: Record<string, any>): void {
    const ip = this.getClientIP(req);
    const key = `${ip}:${category}`;
    
    const currentCount = this.suspiciousActivities.get(key) || 0;
    const newCount = currentCount + 1;
    
    this.suspiciousActivities.set(key, newCount);

    if (newCount >= this.MAX_SUSPICIOUS_ACTIVITIES) {
      this.blockIP(ip, `Múltiplas atividades suspeitas: ${category}`);
      this.suspiciousActivities.delete(key);
    }

    this.logSecurityEvent({
      type: 'suspicious',
      category,
      severity: newCount >= this.MAX_SUSPICIOUS_ACTIVITIES ? 'high' : 'medium',
      source: 'suspicious_activity',
      details: { ...details, count: newCount },
      request: {
        ip,
        userAgent: req.get('User-Agent') || 'unknown',
        method: req.method,
        url: req.originalUrl || req.url,
        headers: this.sanitizeHeaders(req.headers),
      },
    });
  }

  // Obter IP do cliente
  private getClientIP(req: Request): string {
    const forwarded = req.get('x-forwarded-for');
    const realIP = req.get('x-real-ip');
    
    return forwarded?.split(',')[0] || realIP || req.ip || req.connection.remoteAddress || 'unknown';
  }

  // Sanitizar headers para logs
  private sanitizeHeaders(headers: Record<string, any>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    Object.keys(headers).forEach(key => {
      if (key.toLowerCase().includes('authorization') || 
          key.toLowerCase().includes('cookie') ||
          key.toLowerCase().includes('api-key')) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = String(headers[key]);
      }
    });
    
    return sanitized;
  }

  // Middleware de segurança principal
  securityMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const ip = this.getClientIP(req);
      
      // Verificar se IP está bloqueado
      if (this.isBlocked(ip)) {
        this.logSecurityEvent({
          type: 'blocked',
          category: 'brute_force',
          severity: 'medium',
          source: 'blocked_ip',
          details: { ip },
          request: {
            ip,
            userAgent: req.get('User-Agent') || 'unknown',
            method: req.method,
            url: req.originalUrl || req.url,
            headers: this.sanitizeHeaders(req.headers),
          },
        });
        
        res.status(403).json({
          error: 'Acesso bloqueado',
          message: 'Seu IP foi temporariamente bloqueado por questões de segurança',
        });
        return;
      }

      // Adicionar headers de segurança
      res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Robots-Tag': 'noindex, nofollow',
      });

      // Verificar user agent suspeito
      const userAgent = req.get('User-Agent') || '';
      if (this.isSuspiciousUserAgent(userAgent)) {
        this.detectSuspiciousActivity(req, 'bot', { userAgent });
      }

      next();
    };
  }

  // Verificar user agent suspeito
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  // Middleware de rate limiting configurável
  createRateLimiter(options: Partial<RateLimitRule> = {}) {
    const config: RateLimitRule = {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // limite de requisições
      message: 'Muitas requisições deste IP, tente novamente mais tarde',
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        const ip = this.getClientIP(req);
        this.detectSuspiciousActivity(req, 'brute_force', { 
          reason: 'rate_limit_exceeded',
          limit: config.max,
          window: config.windowMs,
        });
        
        res.status(429).json({
          error: 'Muitas requisições',
          message: config.message,
          retryAfter: Math.round(config.windowMs / 1000),
        });
      },
      ...options,
    };

    return rateLimit(config);
  }

  // Middleware de validação de entrada contra XSS
  xssProtection() {
    return [
      body('*').custom((value) => {
        if (typeof value === 'string') {
          const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /data:text\/html/gi,
            /vbscript:/gi,
            /onload/gi,
            /onerror/gi,
            /onclick/gi,
          ];

          const hasXSS = xssPatterns.some(pattern => pattern.test(value));
          if (hasXSS) {
            throw new Error('Conteúdo malicioso detectado');
          }
        }
        return true;
      }),
      (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          this.detectSuspiciousActivity(req, 'xss', { 
            errors: errors.array(),
            body: req.body,
          });
          
          return res.status(400).json({
            error: 'Conteúdo inválido',
            message: 'Dados enviados contêm padrões maliciosos',
            details: errors.array(),
          });
        }
        next();
      },
    ];
  }

  // Middleware de detecção de SQL Injection
  sqlInjectionProtection() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const sqlPatterns = [
        /(\b(union|select|insert|update|delete|drop|create|alter|exec|script|declare|truncate)\b)/gi,
        /(--|\/\*|\*\/)/g,
        /(\b(or|and)\b.*=.*)/gi,
        /'.*or.*'.*=.*'/gi,
        /".*or.*".*=.*"/gi,
        /(\bwaitfor\s+delay\s+)/gi,
        /(\bexec\s*\()/gi,
      ];

      const checkObject = (obj: any, path: string = ''): boolean => {
        if (typeof obj === 'string') {
          return sqlPatterns.some(pattern => pattern.test(obj));
        } else if (typeof obj === 'object' && obj !== null) {
          return Object.keys(obj).some(key => checkObject(obj[key], `${path}.${key}`));
        }
        return false;
      };

      const suspiciousParams = [
        ...Object.values(req.query),
        ...Object.values(req.body),
        ...Object.values(req.params),
      ];

      const hasSQLInjection = suspiciousParams.some(param => checkObject(param));

      if (hasSQLInjection) {
        this.detectSuspiciousActivity(req, 'sql_injection', {
          query: req.query,
          body: req.body,
          params: req.params,
        });

        return res.status(400).json({
          error: 'Requisição inválida',
          message: 'Padrões suspeitos detectados na requisição',
        });
      }

      next();
    };
  }

  // Middleware de detecção de DDoS
  ddosProtection() {
    const requestCounts = new Map<string, { count: number; resetTime: number }>();
    const DDOS_THRESHOLD = 1000; // requisições por segundo
    const WINDOW_MS = 1000; // 1 segundo

    return (req: Request, res: Response, next: NextFunction): void => {
      const ip = this.getClientIP(req);
      const now = Date.now();
      
      const current = requestCounts.get(ip) || { count: 0, resetTime: now + WINDOW_MS };
      
      if (now > current.resetTime) {
        current.count = 0;
        current.resetTime = now + WINDOW_MS;
      }
      
      current.count++;
      requestCounts.set(ip, current);

      const requestsPerSecond = current.count / (WINDOW_MS / 1000);

      if (requestsPerSecond > DDOS_THRESHOLD) {
        this.detectSuspiciousActivity(req, 'ddos', {
          requestsPerSecond,
          threshold: DDOS_THRESHOLD,
          window: WINDOW_MS,
        });

        this.blockIP(ip, 'Ataque DDoS detectado');

        return res.status(503).json({
          error: 'Serviço temporariamente indisponível',
          message: 'Muitas requisições simultâneas detectadas',
        });
      }

      next();
    };
  }

  // Middleware de validação de API Key
  apiKeyValidation() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const apiKey = req.get('X-API-Key') || req.query.apiKey;
      
      if (!apiKey) {
        return res.status(401).json({
          error: 'API Key não fornecida',
          message: 'É necessário fornecer uma API Key válida',
        });
      }

      // Validar API Key (implementar lógica de validação real)
      const isValid = this.validateAPIKey(String(apiKey));
      
      if (!isValid) {
        this.detectSuspiciousActivity(req, 'brute_force', {
          reason: 'invalid_api_key',
          apiKey: String(apiKey).substring(0, 8) + '...',
        });

        return res.status(401).json({
          error: 'API Key inválida',
          message: 'A API Key fornecida não é válida',
        });
      }

      next();
    };
  }

  // Validar API Key (placeholder)
  private validateAPIKey(apiKey: string): boolean {
    // Implementar validação real da API Key
    return apiKey.length >= 32 && /^[a-zA-Z0-9_-]+$/.test(apiKey);
  }

  // Middleware de validação de webhook
  webhookValidation(webhookSecret: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const signature = req.get('X-Webhook-Signature');
      const timestamp = req.get('X-Webhook-Timestamp');
      
      if (!signature || !timestamp) {
        this.detectSuspiciousActivity(req, 'brute_force', {
          reason: 'missing_webhook_headers',
        });

        return res.status(401).json({
          error: 'Assinatura do webhook não fornecida',
          message: 'Requisição de webhook inválida',
        });
      }

      // Verificar timestamp (prevenir replay attacks)
      const now = Math.floor(Date.now() / 1000);
      const webhookTime = parseInt(timestamp);
      
      if (Math.abs(now - webhookTime) > 300) { // 5 minutos de tolerância
        this.detectSuspiciousActivity(req, 'brute_force', {
          reason: 'webhook_timestamp_invalid',
          timestamp,
          serverTime: now,
        });

        return res.status(401).json({
          error: 'Timestamp do webhook inválido',
          message: 'Requisição de webhook expirada',
        });
      }

      // Verificar assinatura
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(`${timestamp}.${payload}`)
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        this.detectSuspiciousActivity(req, 'brute_force', {
          reason: 'webhook_signature_invalid',
        });

        return res.status(401).json({
          error: 'Assinatura do webhook inválida',
          message: 'Falha na verificação da assinatura',
        });
      }

      next();
    };
  }

  // Middleware de sanitização de dados sensíveis
  sanitizeSensitiveData() {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Sanitizar dados de resposta
      const originalJson = res.json;
      res.json = function(data: any) {
        const sanitized = sanitizeObject(data);
        return originalJson.call(this, sanitized);
      };

      next();
    };
  }

  // Obter estatísticas de segurança
  getSecurityStats() {
    return {
      blockedIPs: this.blockedIPs.size,
      suspiciousActivities: this.suspiciousActivities.size,
      recentAlerts: monitoringService.getAlerts(10, 'warning'),
      securityMetrics: {
        totalAttacks: monitoringService.getMetricValue('security.sql_injection') || 0 +
                       monitoringService.getMetricValue('security.xss') || 0 +
                       monitoringService.getMetricValue('security.brute_force') || 0 +
                       monitoringService.getMetricValue('security.ddos') || 0,
        blockedRequests: this.blockedIPs.size,
        suspiciousRequests: this.suspiciousActivities.size,
      },
    };
  }
}

// Função auxiliar para sanitizar objetos
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: any = {};
  
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'string') {
      // Verificar se é dado sensível
      const sensitivePatterns = [
        /password/i,
        /token/i,
        /secret/i,
        /key/i,
        /credit.*card/i,
        /cvv/i,
        /cpf/i,
        /cnpj/i,
        /rg/i,
        /phone/i,
        /email/i,
      ];

      const isSensitive = sensitivePatterns.some(pattern => pattern.test(key));
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = obj[key];
      }
    } else if (typeof obj[key] === 'object') {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  });

  return sanitized;
}

// Singleton
export const securityMonitor = new SecurityMonitor();

export default securityMonitor;
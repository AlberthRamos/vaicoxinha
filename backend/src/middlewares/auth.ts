import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '@/utils/AppError';
import { logger } from '@/utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AuthenticationError('Token não fornecido');
    }

    const [, token] = authHeader.split(' ');
    
    if (!token) {
      throw new AuthenticationError('Token inválido');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error('JWT_SECRET não configurado');
      throw new Error('Configuração inválida');
    }

    const decoded = jwt.verify(token, secret) as any;
    
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Token expirado'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Token inválido'));
    } else {
      next(error);
    }
  }
};

export const authorize = (roles: string[], permissions?: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Usuário não autenticado');
      }

      // Verificar roles
      if (roles.length > 0 && !roles.includes(req.user.role)) {
        logger.warn(`Acesso negado: usuário ${req.user.email} não tem role ${roles.join(', ')}`);
        throw new AuthorizationError('Você não tem permissão para acessar este recurso');
      }

      // Verificar permissions
      if (permissions && permissions.length > 0) {
        const hasPermission = permissions.some(permission => 
          req.user!.permissions.includes(permission)
        );
        
        if (!hasPermission) {
          logger.warn(`Acesso negado: usuário ${req.user.email} não tem permissões ${permissions.join(', ')}`);
          throw new AuthorizationError('Você não tem permissão para realizar esta ação');
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }

    const [, token] = authHeader.split(' ');
    
    if (!token) {
      return next();
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next();
    }

    const decoded = jwt.verify(token, secret) as any;
    
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };

    next();
  } catch (error) {
    // Ignorar erros de autenticação para optional auth
    next();
  }
};
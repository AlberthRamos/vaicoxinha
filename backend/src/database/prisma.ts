import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

// Criar uma instância única do Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Middleware para logging de queries (desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    
    logger.debug(`Query ${params.model}.${params.action} levou ${after - before}ms`);
    
    return result;
  });
}

// Middleware para soft delete
prisma.$use(async (params, next) => {
  if (params.action === 'delete') {
    // Implementar soft delete
    params.action = 'update';
    params.args['data'] = { deletedAt: new Date() };
  }
  
  if (params.action === 'deleteMany') {
    // Implementar soft delete para múltiplos registros
    params.action = 'updateMany';
    if (params.args.data !== undefined) {
      params.args.data['deletedAt'] = new Date();
    } else {
      params.args['data'] = { deletedAt: new Date() };
    }
  }
  
  if (params.action === 'findMany' || params.action === 'findUnique') {
    // Adicionar filtro para não mostrar registros deletados
    if (params.args.where) {
      if (params.args.where.deletedAt === undefined) {
        params.args.where['deletedAt'] = null;
      }
    } else {
      params.args['where'] = { deletedAt: null };
    }
  }
  
  return next(params);
});

// Função para conectar ao banco
export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅ Conectado ao banco de dados');
  } catch (error) {
    logger.error('❌ Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}

// Função para desconectar do banco
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    logger.info('📪 Desconectado do banco de dados');
  } catch (error) {
    logger.error('❌ Erro ao desconectar do banco de dados:', error);
    throw error;
  }
}
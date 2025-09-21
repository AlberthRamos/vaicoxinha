# Backend Development Guide - Vai Coxinha PWA

## Overview
This guide covers the backend development practices, architecture, and implementation details for the Vai Coxinha Progressive Web Application (PWA) API.

## Technology Stack

### Core Technologies
- **Runtime**: Node.js 18.x LTS
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 14.x
- **ORM**: Prisma 5.x
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **File Upload**: Multer + AWS S3

### Development Tools
- **Package Manager**: npm/yarn
- **Code Quality**: ESLint + Prettier
- **Testing**: Jest + Supertest
- **API Documentation**: Swagger/OpenAPI
- **Process Manager**: PM2

## Project Structure

```
backend/
├── src/
│   ├── controllers/        # Request handlers
│   ├── services/           # Business logic
│   ├── repositories/       # Data access layer
│   ├── middlewares/        # Express middlewares
│   ├── routes/             # API routes
│   ├── validators/         # Request validation schemas
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript types
│   ├── config/             # Configuration files
│   ├── prisma/             # Database schema and migrations
│   └── app.ts              # Express app setup
├── tests/                  # Test files
├── docs/                   # API documentation
├── scripts/                # Utility scripts
├── docker/                 # Docker configurations
└── dist/                   # Compiled JavaScript
```

## Architecture Patterns

### Layered Architecture
```
Request → Router → Middleware → Controller → Service → Repository → Database
Response ← Router ← Middleware ← Controller ← Service ← Repository ← Database
```

### Controller Pattern
```typescript
// src/controllers/product-controller.ts
import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product-service';
import { productValidator } from '../validators/product-validator';
import { AppError } from '../utils/app-error';

export class ProductController {
  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, category, search } = req.query;
      
      const filters = {
        page: Number(page),
        limit: Number(limit),
        category: category as string,
        search: search as string,
      };
      
      const result = await productService.getProducts(filters);
      
      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const product = await productService.getProductById(id);
      
      if (!product) {
        throw new AppError('Product not found', 404);
      }
      
      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = productValidator.create.parse(req.body);
      
      const product = await productService.createProduct({
        ...validatedData,
        image: req.file?.location, // From multer-s3
      });
      
      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();
```

### Service Layer Pattern
```typescript
// src/services/product-service.ts
import { prisma } from '../prisma/client';
import { AppError } from '../utils/app-error';
import { cacheService } from './cache-service';

interface ProductFilters {
  page: number;
  limit: number;
  category?: string;
  search?: string;
  isAvailable?: boolean;
}

export class ProductService {
  async getProducts(filters: ProductFilters) {
    const cacheKey = `products:${JSON.stringify(filters)}`;
    
    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    const skip = (filters.page - 1) * filters.limit;
    
    const where = {
      ...(filters.category && { category: filters.category }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
      ...(filters.isAvailable !== undefined && { isAvailable: filters.isAvailable }),
    };
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          _count: {
            select: { orderItems: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);
    
    const result = {
      products,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit),
      },
    };
    
    // Cache for 5 minutes
    await cacheService.set(cacheKey, result, 300);
    
    return result;
  }
  
  async getProductById(id: string) {
    const cacheKey = `product:${id}`;
    
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        nutritionInfo: true,
      },
    });
    
    if (product) {
      await cacheService.set(cacheKey, product, 300);
    }
    
    return product;
  }
  
  async createProduct(data: any) {
    // Business logic validation
    if (data.price <= 0) {
      throw new AppError('Price must be greater than 0', 400);
    }
    
    // Check if product already exists
    const existing = await prisma.product.findFirst({
      where: { name: data.name },
    });
    
    if (existing) {
      throw new AppError('Product with this name already exists', 409);
    }
    
    const product = await prisma.product.create({
      data: {
        ...data,
        slug: this.generateSlug(data.name),
      },
    });
    
    // Invalidate cache
    await cacheService.delPattern('products:*');
    
    return product;
  }
  
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

export const productService = new ProductService();
```

### Repository Pattern
```typescript
// src/repositories/base-repository.ts
import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository<T> {
  constructor(protected prisma: PrismaClient, protected model: any) {}
  
  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }
  
  async findMany(where: any = {}): Promise<T[]> {
    return this.model.findMany({ where });
  }
  
  async create(data: Partial<T>): Promise<T> {
    return this.model.create({ data });
  }
  
  async update(id: string, data: Partial<T>): Promise<T> {
    return this.model.update({ where: { id }, data });
  }
  
  async delete(id: string): Promise<T> {
    return this.model.delete({ where: { id } });
  }
  
  async count(where: any = {}): Promise<number> {
    return this.model.count({ where });
  }
}
```

## Database Design

### Prisma Schema
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enums
enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  READY
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum UserRole {
  CUSTOMER
  ADMIN
}

// User Model
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  phone     String?
  password  String
  role      UserRole @default(CUSTOMER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  orders        Order[]
  cartItems     CartItem[]
  addresses     Address[]
  refreshTokens RefreshToken[]

  @@index([email])
  @@index([role])
}

// Product Model
model Product {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String
  price       Decimal  @db.Decimal(10, 2)
  image       String?
  categoryId  String
  isAvailable Boolean  @default(true)
  isFeatured  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  category      Category       @relation(fields: [categoryId], references: [id])
  orderItems    OrderItem[]
  cartItems     CartItem[]
  nutritionInfo NutritionInfo?

  @@index([categoryId])
  @@index([slug])
  @@index([isAvailable])
  @@index([isFeatured])
  @@index([name])
}

// Order Model
model Order {
  id            String        @id @default(cuid())
  orderNumber   String        @unique @default(uuid())
  userId        String
  status        OrderStatus   @default(PENDING)
  paymentStatus PaymentStatus @default(PENDING)
  totalAmount   Decimal       @db.Decimal(10, 2)
  notes         String?
  scheduledFor  DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations
  user        User         @relation(fields: [userId], references: [id])
  items       OrderItem[]
  payment     Payment?
  address     Address?     @relation(fields: [addressId], references: [id])
  addressId   String?

  @@index([userId])
  @@index([status])
  @@index([paymentStatus])
  @@index([orderNumber])
  @@index([createdAt])
}

// Payment Model
model Payment {
  id            String        @id @default(cuid())
  orderId       String        @unique
  provider      String        // 'mercadopago', 'stripe', etc.
  providerId    String?       // External payment ID
  status        PaymentStatus @default(PENDING)
  amount        Decimal       @db.Decimal(10, 2)
  method        String?       // 'credit_card', 'pix', etc.
  installments  Int?          @default(1)
  paidAt        DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations
  order Order @relation(fields: [orderId], references: [id])

  @@index([orderId])
  @@index([status])
  @@index([providerId])
}
```

### Database Migrations
```bash
# Create migration
npx prisma migrate dev --name add_product_slug

# Apply migrations
npx prisma migrate deploy

# Generate client
npx prisma generate

# Seed database
npx prisma db seed
```

## Authentication & Authorization

### JWT Implementation
```typescript
// src/services/auth-service.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/app-error';

interface TokenPayload {
  userId: string;
  role: string;
}

export class AuthService {
  private readonly ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
  private readonly REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';
  
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }
    
    const tokens = await this.generateTokens(user.id, user.role);
    
    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
    
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }
  
  async refreshToken(refreshToken: string) {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });
    
    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new AppError('Invalid refresh token', 401);
    }
    
    // Delete old refresh token
    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
    
    // Generate new tokens
    const tokens = await this.generateTokens(tokenRecord.userId, tokenRecord.user.role);
    
    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: tokenRecord.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    
    return tokens;
  }
  
  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }
  
  private async generateTokens(userId: string, role: string) {
    const payload: TokenPayload = { userId, role };
    
    const accessToken = jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });
    
    const refreshToken = jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    });
    
    return { accessToken, refreshToken };
  }
  
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.ACCESS_TOKEN_SECRET) as TokenPayload;
    } catch (error) {
      throw new AppError('Invalid access token', 401);
    }
  }
}

export const authService = new AuthService();
```

### Authorization Middleware
```typescript
// src/middlewares/auth-middleware.ts
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth-service';
import { AppError } from '../utils/app-error';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return next(new AppError('Access token required', 401));
  }
  
  try {
    const payload = authService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    next(new AppError('Invalid access token', 401));
  }
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    
    next();
  };
}
```

## Payment Integration

### MercadoPago Integration
```typescript
// src/services/payment-service.ts
import mercadopago from 'mercadopago';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/app-error';

export class PaymentService {
  constructor() {
    mercadopago.configure({
      access_token: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });
  }
  
  async createPayment(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    
    const preference = {
      items: order.items.map(item => ({
        id: item.productId,
        title: item.product.name,
        quantity: item.quantity,
        currency_id: 'BRL',
        unit_price: Number(item.price),
      })),
      payer: {
        name: order.user.name,
        email: order.user.email,
      },
      external_reference: orderId,
      notification_url: `${process.env.API_URL}/webhooks/mercadopago`,
      back_urls: {
        success: `${process.env.FRONTEND_URL}/orders/${orderId}/success`,
        failure: `${process.env.FRONTEND_URL}/orders/${orderId}/failure`,
        pending: `${process.env.FRONTEND_URL}/orders/${orderId}/pending`,
      },
      auto_return: 'approved',
    };
    
    const response = await mercadopago.preferences.create(preference);
    
    // Create payment record
    await prisma.payment.create({
      data: {
        orderId,
        provider: 'mercadopago',
        providerId: response.body.id,
        amount: order.totalAmount,
        status: 'PENDING',
      },
    });
    
    return {
      paymentUrl: response.body.init_point,
      preferenceId: response.body.id,
    };
  }
  
  async handleWebhook(paymentId: string) {
    const payment = await mercadopago.payment.findById(paymentId);
    
    const orderId = payment.body.external_reference;
    const status = this.mapPaymentStatus(payment.body.status);
    
    // Update payment status
    await prisma.payment.update({
      where: { orderId },
      data: {
        status,
        paidAt: status === 'PAID' ? new Date() : null,
      },
    });
    
    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: status,
        status: status === 'PAID' ? 'CONFIRMED' : 'PENDING',
      },
    });
    
    // Send notification (email, push, etc.)
    await this.sendPaymentNotification(orderId, status);
  }
  
  private mapPaymentStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'approved': 'PAID',
      'pending': 'PENDING',
      'rejected': 'FAILED',
      'cancelled': 'FAILED',
      'refunded': 'REFUNDED',
    };
    
    return statusMap[status] || 'PENDING';
  }
  
  private async sendPaymentNotification(orderId: string, status: string) {
    // Implementation for sending notifications
    // Email, push notification, etc.
  }
}

export const paymentService = new PaymentService();
```

## Error Handling

### Custom Error Classes
```typescript
// src/utils/app-error.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly errors: any[];
  
  constructor(errors: any[]) {
    super('Validation failed', 400);
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}
```

### Global Error Handler
```typescript
// src/middlewares/error-middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });
  
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        ...(error instanceof ValidationError && { errors: error.errors }),
      },
    });
  }
  
  // Database errors
  if (error.name === 'PrismaClientKnownRequestError') {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Resource already exists',
          field: error.meta?.target,
        },
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: { message: 'Resource not found' },
      });
    }
  }
  
  // Default error
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  });
}
```

## Testing Strategy

### Unit Testing
```typescript
// tests/services/product-service.test.ts
import { productService } from '../../src/services/product-service';
import { prisma } from '../../src/prisma/client';
import { cacheService } from '../../src/services/cache-service';

jest.mock('../../src/prisma/client');
jest.mock('../../src/services/cache-service');

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getProducts', () => {
    it('should return cached products if available', async () => {
      const cachedProducts = {
        products: [{ id: '1', name: 'Test Product' }],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 },
      };
      
      (cacheService.get as jest.Mock).mockResolvedValue(cachedProducts);
      
      const result = await productService.getProducts({
        page: 1,
        limit: 20,
      });
      
      expect(result).toEqual(cachedProducts);
      expect(cacheService.get).toHaveBeenCalledWith('products:{"page":1,"limit":20}');
      expect(prisma.product.findMany).not.toHaveBeenCalled();
    });
    
    it('should fetch from database if cache miss', async () => {
      const dbProducts = [
        { id: '1', name: 'Test Product', category: { id: '1', name: 'Category' } },
      ];
      
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prisma.product.findMany as jest.Mock).mockResolvedValue(dbProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(1);
      
      const result = await productService.getProducts({
        page: 1,
        limit: 20,
      });
      
      expect(result.products).toEqual(dbProducts);
      expect(prisma.product.findMany).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalled();
    });
  });
  
  describe('createProduct', () => {
    it('should throw error if price is invalid', async () => {
      await expect(
        productService.createProduct({
          name: 'Test Product',
          price: -10,
          description: 'Description',
          categoryId: '1',
        })
      ).rejects.toThrow('Price must be greater than 0');
    });
    
    it('should create product successfully', async () => {
      const productData = {
        name: 'New Product',
        price: 10.99,
        description: 'Description',
        categoryId: '1',
      };
      
      const createdProduct = { id: '1', ...productData };
      
      (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.product.create as jest.Mock).mockResolvedValue(createdProduct);
      
      const result = await productService.createProduct(productData);
      
      expect(result).toEqual(createdProduct);
      expect(cacheService.delPattern).toHaveBeenCalledWith('products:*');
    });
  });
});
```

### Integration Testing
```typescript
// tests/integration/order-flow.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/prisma/client';
import { authService } from '../../src/services/auth-service';

describe('Order Flow Integration', () => {
  let authToken: string;
  let userId: string;
  let productId: string;
  
  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        role: 'CUSTOMER',
      },
    });
    
    userId = user.id;
    authToken = authService.generateTokens(user.id, user.role).accessToken;
    
    // Create test product
    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        price: 10.99,
        description: 'Test Description',
        categoryId: '1',
        isAvailable: true,
      },
    });
    
    productId = product.id;
  });
  
  afterAll(async () => {
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
  });
  
  it('should create order successfully', async () => {
    const orderData = {
      items: [
        {
          productId,
          quantity: 2,
          price: 10.99,
        },
      ],
      address: {
        street: 'Test Street',
        number: '123',
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        zipCode: '12345-678',
      },
    };
    
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send(orderData)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('PENDING');
    expect(response.body.data.totalAmount).toBe(21.98);
  });
  
  it('should get user orders', async () => {
    const response = await request(app)
      .get('/api/orders/my-orders')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
  });
});
```

## Deployment Configuration

### Environment Variables
```bash
# .env.production
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/vai_coxinha

# JWT Secrets
ACCESS_TOKEN_SECRET=your-access-token-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=vai-coxinha-images

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=your-mercadopago-token

# Redis
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'vai-coxinha-api',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001,
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    watch: false,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=4096',
  }],
};
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY dist ./dist
COPY prisma ./prisma

RUN npx prisma generate

EXPOSE 3001

CMD ["node", "dist/server.js"]
```

This comprehensive backend development guide provides the foundation for building a robust, scalable, and maintainable API for the Vai Coxinha PWA. Follow these patterns and practices to ensure consistent, secure, and performant backend services.
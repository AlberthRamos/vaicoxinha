# Security Hardening Guide - Vai Coxinha PWA

## Frontend Security

### 1. Content Security Policy (CSP)
```javascript
// next.config.js
headers: [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' localhost:* vai-coxinha.s3.amazonaws.com;"
  }
]
```

### 2. XSS Prevention
- **Input Sanitization**: Sanitize all user inputs
- **Output Encoding**: Encode all dynamic content
- **DOM Purification**: Use DOMPurify for HTML content
- **React Protection**: Leverage React's built-in XSS protection

### 3. HTTPS Enforcement
- **HSTS Headers**: Force HTTPS connections
- **Secure Cookies**: Set Secure and HttpOnly flags
- **Mixed Content**: Prevent mixed content loading
- **Certificate Pinning**: Implement certificate pinning for mobile

## Backend Security

### 1. Authentication & Authorization
```typescript
// JWT Implementation
const jwt = require('jsonwebtoken');
const token = jwt.sign(payload, process.env.JWT_SECRET, {
  expiresIn: '15m',
  issuer: 'vai-coxinha-api',
  audience: 'vai-coxinha-app'
});
```

### 2. Input Validation
```typescript
// Using class-validator
export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  customerName: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber('BR')
  phone: string;
}
```

### 3. Rate Limiting
```typescript
// Rate limiting configuration
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

### 4. SQL Injection Prevention
- **Parameterized Queries**: Always use parameterized queries
- **ORM Protection**: Use TypeORM with proper validation
- **Input Sanitization**: Sanitize all database inputs
- **Least Privilege**: Use minimal database permissions

## API Security

### 1. API Gateway Security
```typescript
// API Gateway configuration
const gatewayConfig = {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  },
  rateLimiting: {
    windowMs: 60000,
    max: 1000
  },
  apiKey: {
    header: 'x-api-key',
    prefix: 'vai-coxinha-'
  }
};
```

### 2. Request Validation
```typescript
// Request validation middleware
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details
      });
    }
    next();
  };
};
```

### 3. Error Handling
```typescript
// Secure error handling
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error details (without sensitive data)
  logger.error('Request failed', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Send generic error response
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.id
  });
};
```

## Payment Security

### 1. PCI DSS Compliance
- **Tokenization**: Never store raw payment data
- **Encryption**: Use strong encryption for all payment data
- **Network Segmentation**: Isolate payment systems
- **Regular Audits**: Conduct regular security audits

### 2. PIX Security
```typescript
// PIX payment security
const pixPayment = {
  // Generate unique transaction ID
  transactionId: crypto.randomUUID(),
  
  // Set expiration time (30 minutes)
  expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  
  // Validate amount limits
  validateAmount: (amount: number) => {
    if (amount < 1 || amount > 5000) {
      throw new Error('Invalid amount');
    }
  },
  
  // Rate limiting per user
  rateLimit: {
    windowMs: 60 * 1000,
    max: 5
  }
};
```

## Infrastructure Security

### 1. Environment Variables
```bash
# .env.example
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
MONGODB_URI=mongodb://localhost:27017/vai-coxinha
MERCADOPAGO_TOKEN=your-mercadopago-token
API_KEY=your-api-key
CORS_ORIGIN=https://vai-coxinha.com
```

### 2. Docker Security
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### 3. Network Security
- **Firewall Rules**: Implement strict firewall rules
- **VPN Access**: Require VPN for administrative access
- **Network Segmentation**: Isolate different service tiers
- **DDoS Protection**: Implement DDoS protection

## Data Protection

### 1. Encryption
```typescript
// Encryption utilities
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const secretKey = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, secretKey);
  cipher.setAAD(Buffer.from('additional-data'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};
```

### 2. Data Anonymization
```typescript
// Data anonymization for analytics
export const anonymizeUserData = (user: User) => {
  return {
    userId: hashUserId(user.id),
    location: anonymizeLocation(user.location),
    orderCount: user.orderCount,
    totalSpent: user.totalSpent,
    lastOrderDate: user.lastOrderDate
  };
};
```

## Monitoring and Alerting

### 1. Security Monitoring
```typescript
// Security event logging
export const logSecurityEvent = (event: SecurityEvent) => {
  logger.warn('Security event detected', {
    eventType: event.type,
    severity: event.severity,
    source: event.source,
    timestamp: new Date().toISOString(),
    metadata: event.metadata
  });
  
  // Send alert for high-severity events
  if (event.severity === 'high') {
    sendSecurityAlert(event);
  }
};
```

### 2. Intrusion Detection
- **Failed Login Attempts**: Monitor and alert on multiple failed logins
- **Suspicious Activity**: Detect unusual patterns in user behavior
- **API Abuse**: Monitor for API abuse patterns
- **Data Exfiltration**: Detect potential data breaches

## Compliance and Auditing

### 1. Audit Logging
```typescript
// Audit log structure
export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}
```

### 2. Compliance Requirements
- **LGPD Compliance**: Brazilian data protection law
- **PCI DSS**: Payment card industry standards
- **OWASP Top 10**: Address common security vulnerabilities
- **Regular Penetration Testing**: Conduct regular security assessments

## Security Checklist

### Development Phase
- [ ] Implement input validation
- [ ] Use parameterized queries
- [ ] Implement proper authentication
- [ ] Add rate limiting
- [ ] Enable CORS properly
- [ ] Implement secure headers

### Deployment Phase
- [ ] Use HTTPS everywhere
- [ ] Configure security headers
- [ ] Enable audit logging
- [ ] Set up monitoring
- [ ] Configure firewalls
- [ ] Implement backup strategies

### Maintenance Phase
- [ ] Regular security updates
- [ ] Monitor security alerts
- [ ] Conduct security audits
- [ ] Update dependencies
- [ ] Review access controls
- [ ] Test incident response
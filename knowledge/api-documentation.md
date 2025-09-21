# API Documentation - Vai Coxinha PWA

## Base URL
- **Production**: `https://api.vai-coxinha.com`
- **Development**: `http://localhost:3001`
- **API Version**: `/api/v1`

## Authentication

### JWT Token Authentication
All protected endpoints require a JWT token in the Authorization header:
```http
Authorization: Bearer <your-jwt-token>
```

### Token Management
- **Access Token**: Expires in 15 minutes
- **Refresh Token**: Expires in 7 days
- **Token Type**: Bearer

### Error Responses
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid or expired token"
}
```

## Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/logout` | User logout | Yes |
| GET | `/api/auth/profile` | Get user profile | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |
| GET | `/api/products` | List all products | No |
| GET | `/api/products/:id` | Get product details | No |
| GET | `/api/categories` | List categories | No |
| POST | `/api/orders` | Create new order | Yes |
| GET | `/api/orders` | List user orders | Yes |
| GET | `/api/orders/:id` | Get order details | Yes |
| PUT | `/api/orders/:id/status` | Update order status | Admin |
| POST | `/api/payments/create` | Create payment | Yes |
| POST | `/api/payments/webhook` | Payment webhook | No |
| POST | `/api/cart/add` | Add to cart | Yes |
| GET | `/api/cart` | Get cart items | Yes |
| DELETE | `/api/cart/:id` | Remove from cart | Yes |
| POST | `/api/upload` | Upload image | Admin |
| GET | `/api/analytics/dashboard` | Get analytics | Admin |
| GET | `/api/health` | Health check | No |

## Detailed Endpoint Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "securePassword123",
  "phone": "+5511999999999"
}
```

**Response (201 Created)**:
```json
{
  "user": {
    "id": "60d5eca77f1b2c001c8e4567",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "+5511999999999",
    "role": "customer",
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Email already exists

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "joao@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK)**:
```json
{
  "user": {
    "id": "60d5eca77f1b2c001c8e4567",
    "name": "João Silva",
    "email": "joao@example.com",
    "role": "customer"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Missing required fields

### Product Endpoints

#### List Products
```http
GET /api/products?category=bebidas&available=true&sort=price&order=asc&page=1&limit=20
```

**Query Parameters**:
- `category` (optional): Filter by category
- `available` (optional): Filter by availability
- `search` (optional): Search term
- `sort` (optional): Sort field (name, price, createdAt)
- `order` (optional): Sort order (asc, desc)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200 OK)**:
```json
{
  "products": [
    {
      "id": "60d5eca77f1b2c001c8e4567",
      "name": "Coxinha de Frango",
      "description": "Coxinha crocante com recheio de frango desfiado",
      "price": 8.50,
      "category": "salgados",
      "image": "https://vai-coxinha.s3.amazonaws.com/products/coxinha-frango.jpg",
      "available": true,
      "stock": 50,
      "preparationTime": 15,
      "nutritionalInfo": {
        "calories": 180,
        "protein": 12,
        "carbs": 15,
        "fat": 8
      },
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### Get Product Details
```http
GET /api/products/60d5eca77f1b2c001c8e4567
```

**Response (200 OK)**:
```json
{
  "product": {
    "id": "60d5eca77f1b2c001c8e4567",
    "name": "Coxinha de Frango",
    "description": "Coxinha crocante com recheio de frango desfiado",
    "price": 8.50,
    "category": "salgados",
    "image": "https://vai-coxinha.s3.amazonaws.com/products/coxinha-frango.jpg",
    "images": [
      "https://vai-coxinha.s3.amazonaws.com/products/coxinha-frango-1.jpg",
      "https://vai-coxinha.s3.amazonaws.com/products/coxinha-frango-2.jpg"
    ],
    "available": true,
    "stock": 50,
    "preparationTime": 15,
    "nutritionalInfo": {
      "calories": 180,
      "protein": 12,
      "carbs": 15,
      "fat": 8
    },
    "ingredients": ["Frango", "Farinha de trigo", "Leite", "Cebola"],
    "allergens": ["Glúten", "Lactose"],
    "tags": ["salgado", "frango", "popular"],
    "rating": 4.5,
    "reviewCount": 23,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Order Endpoints

#### Create Order
```http
POST /api/orders
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "items": [
    {
      "productId": "60d5eca77f1b2c001c8e4567",
      "quantity": 2,
      "observations": "Sem cebola"
    }
  ],
  "deliveryAddress": {
    "street": "Rua das Flores",
    "number": "123",
    "complement": "Apto 45",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567",
    "reference": "Próximo ao mercado"
  },
  "deliveryMethod": "delivery", // or "pickup"
  "scheduledTime": "2023-01-01T12:00:00.000Z", // optional
  "paymentMethod": "credit_card",
  "notes": "Tocar interfone",
  "customer": {
    "name": "João Silva",
    "phone": "+5511999999999",
    "email": "joao@example.com"
  }
}
```

**Response (201 Created)**:
```json
{
  "order": {
    "id": "60d5eca77f1b2c001c8e4568",
    "orderNumber": "VC-2023-0001",
    "status": "pending",
    "items": [
      {
        "productId": "60d5eca77f1b2c001c8e4567",
        "name": "Coxinha de Frango",
        "price": 8.50,
        "quantity": 2,
        "subtotal": 17.00,
        "observations": "Sem cebola"
      }
    ],
    "subtotal": 17.00,
    "deliveryFee": 5.00,
    "total": 22.00,
    "deliveryAddress": {
      "street": "Rua das Flores",
      "number": "123",
      "complement": "Apto 45",
      "neighborhood": "Centro",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234-567",
      "reference": "Próximo ao mercado"
    },
    "deliveryMethod": "delivery",
    "estimatedDeliveryTime": "2023-01-01T13:00:00.000Z",
    "paymentMethod": "credit_card",
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2023-01-01T11:00:00.000Z",
        "note": "Pedido recebido"
      }
    ],
    "createdAt": "2023-01-01T11:00:00.000Z",
    "updatedAt": "2023-01-01T11:00:00.000Z"
  }
}
```

#### List User Orders
```http
GET /api/orders?status=pending&page=1&limit=10
```

**Query Parameters**:
- `status` (optional): Filter by status (pending, confirmed, preparing, ready, delivered, cancelled)
- `startDate` (optional): Filter by start date (ISO 8601)
- `endDate` (optional): Filter by end date (ISO 8601)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200 OK)**:
```json
{
  "orders": [
    {
      "id": "60d5eca77f1b2c001c8e4568",
      "orderNumber": "VC-2023-0001",
      "status": "pending",
      "total": 22.00,
      "itemCount": 2,
      "createdAt": "2023-01-01T11:00:00.000Z",
      "estimatedDeliveryTime": "2023-01-01T13:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

#### Update Order Status (Admin)
```http
PUT /api/orders/60d5eca77f1b2c001c8e4568/status
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "status": "preparing",
  "note": "Preparando pedido"
}
```

**Response (200 OK)**:
```json
{
  "order": {
    "id": "60d5eca77f1b2c001c8e4568",
    "status": "preparing",
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2023-01-01T11:00:00.000Z",
        "note": "Pedido recebido"
      },
      {
        "status": "preparing",
        "timestamp": "2023-01-01T11:15:00.000Z",
        "note": "Preparando pedido"
      }
    ],
    "updatedAt": "2023-01-01T11:15:00.000Z"
  }
}
```

### Payment Endpoints

#### Create Payment
```http
POST /api/payments/create
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "orderId": "60d5eca77f1b2c001c8e4568",
  "paymentMethod": "credit_card",
  "installments": 1
}
```

**Response (201 Created)**:
```json
{
  "payment": {
    "id": "pay_60d5eca77f1b2c001c8e4569",
    "status": "pending",
    "paymentMethod": "credit_card",
    "amount": 22.00,
    "installments": 1,
    "mercadoPagoPreferenceId": "123456789",
    "mercadoPagoInitPoint": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123456789",
    "createdAt": "2023-01-01T11:05:00.000Z"
  }
}
```

### Cart Endpoints

#### Add to Cart
```http
POST /api/cart/add
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "productId": "60d5eca77f1b2c001c8e4567",
  "quantity": 2,
  "observations": "Sem cebola"
}
```

**Response (201 Created)**:
```json
{
  "cartItem": {
    "id": "60d5eca77f1b2c001c8e4570",
    "productId": "60d5eca77f1b2c001c8e4567",
    "name": "Coxinha de Frango",
    "price": 8.50,
    "quantity": 2,
    "subtotal": 17.00,
    "observations": "Sem cebola",
    "createdAt": "2023-01-01T10:30:00.000Z"
  },
  "cartTotal": 17.00,
  "itemCount": 2
}
```

#### Get Cart
```http
GET /api/cart
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```json
{
  "cart": {
    "items": [
      {
        "id": "60d5eca77f1b2c001c8e4570",
        "productId": "60d5eca77f1b2c001c8e4567",
        "name": "Coxinha de Frango",
        "price": 8.50,
        "quantity": 2,
        "subtotal": 17.00,
        "observations": "Sem cebola"
      }
    ],
    "total": 17.00,
    "itemCount": 2,
    "updatedAt": "2023-01-01T10:30:00.000Z"
  }
}
```

### Analytics Endpoints

#### Get Dashboard Analytics (Admin)
```http
GET /api/analytics/dashboard?startDate=2023-01-01&endDate=2023-01-31
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```json
{
  "analytics": {
    "period": {
      "start": "2023-01-01",
      "end": "2023-01-31"
    },
    "orders": {
      "total": 150,
      "totalValue": 3450.00,
      "averageValue": 23.00,
      "byStatus": {
        "pending": 10,
        "confirmed": 20,
        "preparing": 15,
        "ready": 5,
        "delivered": 95,
        "cancelled": 5
      }
    },
    "products": {
      "topSelling": [
        {
          "productId": "60d5eca77f1b2c001c8e4567",
          "name": "Coxinha de Frango",
          "quantity": 200,
          "revenue": 1700.00
        }
      ]
    },
    "customers": {
      "new": 45,
      "returning": 105,
      "total": 120
    }
  }
}
```

### Health Check

#### Health Status
```http
GET /api/health
```

**Response (200 OK)**:
```json
{
  "status": "ok",
  "timestamp": "2023-01-01T12:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "mercadoPago": "connected"
  },
  "metrics": {
    "uptime": 3600,
    "memory": {
      "used": 134217728,
      "total": 536870912
    },
    "database": {
      "connections": 5,
      "queries": 1234
    }
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Email must be valid"
    }
  ]
}
```

### Common HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Rate Limiting
- **Standard**: 100 requests per 15 minutes per IP
- **Authenticated**: 200 requests per 15 minutes per user
- **Upload**: 10 uploads per hour per user

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhooks

### Payment Webhook (Mercado Pago)
```http
POST /api/payments/webhook
Content-Type: application/json

{
  "id": 123456789,
  "live_mode": true,
  "type": "payment",
  "date_created": "2023-01-01T12:00:00.000Z",
  "application_id": 123456,
  "user_id": 123456,
  "version": 1,
  "api_version": "v1",
  "action": "payment.updated",
  "data": {
    "id": "pay_60d5eca77f1b2c001c8e4569"
  }
}
```

**Response (200 OK)**:
```json
{
  "status": "processed",
  "paymentId": "pay_60d5eca77f1b2c001c8e4569",
  "orderId": "60d5eca77f1b2c001c8e4568"
}
```

## Testing

### Test Users
```json
{
  "admin": {
    "email": "admin@vai-coxinha.com",
    "password": "admin123"
  },
  "customer": {
    "email": "customer@vai-coxinha.com",
    "password": "customer123"
  }
}
```

### Test Cards (Mercado Pago Sandbox)
```json
{
  "approved": {
    "cardNumber": "5031 4332 1540 6351",
    "securityCode": "123",
    "expirationDate": "11/25",
    "cardholderName": "APRO"
  },
  "rejected": {
    "cardNumber": "5031 4332 1540 6351",
    "securityCode": "123",
    "expirationDate": "11/25",
    "cardholderName": "REPRO"
  }
}
```

## SDK and Libraries

### JavaScript/TypeScript
```bash
npm install axios
```

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.vai-coxinha.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token logic
      const newToken = await refreshToken();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);

// Usage
const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response.data);
    throw error;
  }
};
```

### cURL Examples
```bash
# Register user
curl -X POST https://api.vai-coxinha.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "password": "password123"}'

# Login
curl -X POST https://api.vai-coxinha.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Get products
curl -X GET https://api.vai-coxinha.com/api/products

# Create order (authenticated)
curl -X POST https://api.vai-coxinha.com/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"items": [{"productId": "123", "quantity": 2}]}'
```

## Changelog

### Version 1.0.0 (2023-01-01)
- Initial API release
- Authentication system
- Product management
- Order processing
- Payment integration
- Basic analytics

### Version 1.1.0 (2023-02-01)
- Added cart functionality
- Enhanced product search
- Improved error handling
- Added rate limiting
- Performance optimizations

## Support

For API support, please contact:
- **Email**: api-support@vai-coxinha.com
- **Documentation**: https://docs.vai-coxinha.com
- **Status Page**: https://status.vai-coxinha.com
- **Developer Portal**: https://developers.vai-coxinha.com
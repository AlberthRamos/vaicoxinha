# Testing Strategy - Vai Coxinha PWA

## Testing Overview

This document outlines the comprehensive testing strategy for the Vai Coxinha PWA, covering unit tests, integration tests, end-to-end tests, performance tests, and security tests.

## Frontend Testing

### 1. Unit Tests (Jest + React Testing Library)

```typescript
// Example component test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuItem from '../components/MenuItem';

describe('MenuItem Component', () => {
  const mockItem = {
    id: '1',
    name: 'Coxinha Tradicional',
    price: 5.90,
    image: '/images/coxinha-tradicional.jpg',
    description: 'Delicious traditional coxinha',
    category: 'tradicional'
  };

  test('renders menu item correctly', () => {
    render(<MenuItem item={mockItem} />);
    
    expect(screen.getByText('Coxinha Tradicional')).toBeInTheDocument();
    expect(screen.getByText('R$ 5,90')).toBeInTheDocument();
    expect(screen.getByAltText('Coxinha Tradicional')).toBeInTheDocument();
  });

  test('handles add to cart action', async () => {
    const mockAddToCart = jest.fn();
    render(<MenuItem item={mockItem} onAddToCart={mockAddToCart} />);
    
    const addButton = screen.getByRole('button', { name: /adicionar/i });
    await userEvent.click(addButton);
    
    expect(mockAddToCart).toHaveBeenCalledWith(mockItem);
  });

  test('displays loading state', () => {
    render(<MenuItem item={mockItem} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

### 2. Custom Hooks Testing

```typescript
// Custom hook test example
import { renderHook, act } from '@testing-library/react-hooks';
import { useCart } from '../hooks/useCart';

describe('useCart Hook', () => {
  test('adds item to cart', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({ id: '1', name: 'Coxinha', price: 5.90, quantity: 1 });
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.total).toBe(5.90);
  });

  test('removes item from cart', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({ id: '1', name: 'Coxinha', price: 5.90, quantity: 1 });
      result.current.removeItem('1');
    });
    
    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  test('calculates total correctly', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({ id: '1', name: 'Coxinha', price: 5.90, quantity: 2 });
      result.current.addItem({ id: '2', name: 'Pastel', price: 8.50, quantity: 1 });
    });
    
    expect(result.current.total).toBe(20.30); // (5.90 * 2) + 8.50
  });
});
```

### 3. API Service Testing

```typescript
// API service test
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { menuService } from '../services/menuService';

describe('MenuService', () => {
  let mockAxios;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  test('fetches menu items successfully', async () => {
    const mockItems = [
      { id: '1', name: 'Coxinha Tradicional', price: 5.90 },
      { id: '2', name: 'Coxinha com Catupiry', price: 6.90 }
    ];

    mockAxios.onGet('/api/menu').reply(200, mockItems);

    const result = await menuService.getMenuItems();
    
    expect(result).toEqual(mockItems);
  });

  test('handles API errors gracefully', async () => {
    mockAxios.onGet('/api/menu').reply(500);

    await expect(menuService.getMenuItems()).rejects.toThrow();
  });

  test('retries failed requests', async () => {
    mockAxios.onGet('/api/menu').replyOnce(500);
    mockAxios.onGet('/api/menu').reply(200, []);

    const result = await menuService.getMenuItems();
    
    expect(result).toEqual([]);
  });
});
```

## Backend Testing

### 1. Controller Tests (NestJS)

```typescript
// Order controller test
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('OrderController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/orders (POST)', () => {
    it('creates order successfully', () => {
      const orderData = {
        customerName: 'John Doe',
        email: 'john@example.com',
        phone: '+5511999999999',
        items: [
          { productId: '1', quantity: 2, price: 5.90 }
        ],
        total: 11.80,
        paymentMethod: 'pix'
      };

      return request(app.getHttpServer())
        .post('/orders')
        .send(orderData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.status).toBe('pending');
          expect(res.body.total).toBe(11.80);
        });
    });

    it('validates required fields', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('customerName');
          expect(res.body.message).toContain('email');
        });
    });
  });
});
```

### 2. Service Tests

```typescript
// Order service test
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { OrderService } from './order.service';
import { Order } from './schemas/order.schema';

describe('OrderService', () => {
  let service: OrderService;
  let mockOrderModel;

  beforeEach(async () => {
    mockOrderModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  describe('createOrder', () => {
    it('creates order with calculated total', async () => {
      const orderData = {
        customerName: 'John Doe',
        email: 'john@example.com',
        items: [
          { productId: '1', quantity: 2, price: 5.90 },
          { productId: '2', quantity: 1, price: 6.90 }
        ]
      };

      const expectedOrder = {
        ...orderData,
        total: 18.70,
        status: 'pending',
        createdAt: expect.any(Date)
      };

      mockOrderModel.create.mockResolvedValue(expectedOrder);

      const result = await service.createOrder(orderData);

      expect(result.total).toBe(18.70);
      expect(mockOrderModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          total: 18.70,
          status: 'pending'
        })
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('updates order status successfully', async () => {
      const orderId = 'order123';
      const newStatus = 'preparing';
      const updatedOrder = {
        id: orderId,
        status: newStatus,
        updatedAt: new Date()
      };

      mockOrderModel.findByIdAndUpdate.mockResolvedValue(updatedOrder);

      const result = await service.updateOrderStatus(orderId, newStatus);

      expect(result.status).toBe(newStatus);
      expect(mockOrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        orderId,
        { status: newStatus },
        { new: true }
      );
    });
  });
});
```

## Integration Testing

### 1. Database Integration

```typescript
// Database integration test
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Order, OrderSchema } from '../src/orders/schemas/order.schema';
import { OrdersService } from '../src/orders/orders.service';

describe('OrdersService Integration', () => {
  let service: OrdersService;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
      ],
      providers: [OrdersService],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterAll(async () => {
    await mongod.stop();
  });

  describe('Order lifecycle', () => {
    it('creates, updates, and retrieves orders', async () => {
      // Create order
      const orderData = {
        customerName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+5511988888888',
        items: [{ productId: '1', quantity: 3, price: 5.90 }],
        total: 17.70,
        paymentMethod: 'pix'
      };

      const createdOrder = await service.createOrder(orderData);
      expect(createdOrder.status).toBe('pending');

      // Update status
      const updatedOrder = await service.updateOrderStatus(createdOrder.id, 'preparing');
      expect(updatedOrder.status).toBe('preparing');

      // Retrieve order
      const foundOrder = await service.getOrderById(createdOrder.id);
      expect(foundOrder.status).toBe('preparing');
    });
  });
});
```

### 2. Payment Integration Testing

```typescript
// Payment integration test
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from '../src/payment/payment.service';
import { MercadoPagoService } from '../src/payment/mercadopago.service';

describe('Payment Integration', () => {
  let paymentService: PaymentService;
  let mercadoPagoService: MercadoPagoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: MercadoPagoService,
          useValue: {
            createPayment: jest.fn(),
            getPaymentStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    paymentService = module.get<PaymentService>(PaymentService);
    mercadoPagoService = module.get<MercadoPagoService>(MercadoPagoService);
  });

  describe('PIX Payment', () => {
    it('creates PIX payment successfully', async () => {
      const order = {
        id: 'order123',
        total: 25.80,
        customerEmail: 'customer@example.com'
      };

      const mockPixData = {
        qrCode: '00020101021226860014BR.GOV.BCB.PIX...',
        qrCodeImage: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
        transactionId: 'txn123'
      };

      jest.spyOn(mercadoPagoService, 'createPayment').mockResolvedValue(mockPixData);

      const result = await paymentService.createPixPayment(order);

      expect(result).toHaveProperty('qrCode');
      expect(result).toHaveProperty('qrCodeImage');
      expect(result.transactionId).toBe('txn123');
    });
  });
});
```

## End-to-End Testing

### 1. User Journey Tests (Cypress)

```javascript
// cypress/e2e/order-flow.cy.js
describe('Complete Order Flow', () => {
  beforeEach(() => {
    cy.viewport('iphone-x');
    cy.visit('/');
  });

  it('completes a full order successfully', () => {
    // Navigate to menu
    cy.get('[data-testid="menu-button"]').click();
    cy.url().should('include', '/menu');

    // Add items to cart
    cy.get('[data-testid="menu-item"]').first().within(() => {
      cy.get('[data-testid="add-to-cart"]').click();
    });

    cy.get('[data-testid="cart-badge"]').should('contain', '1');

    // View cart
    cy.get('[data-testid="cart-button"]').click();
    cy.get('[data-testid="cart-item"]').should('have.length', 1);

    // Proceed to checkout
    cy.get('[data-testid="checkout-button"]').click();
    cy.url().should('include', '/checkout');

    // Fill customer information
    cy.get('[data-testid="customer-name"]').type('John Doe');
    cy.get('[data-testid="customer-email"]').type('john@example.com');
    cy.get('[data-testid="customer-phone"]').type('11999999999');

    // Select payment method
    cy.get('[data-testid="payment-pix"]').click();

    // Complete order
    cy.get('[data-testid="complete-order"]').click();

    // Verify success page
    cy.url().should('include', '/success');
    cy.get('[data-testid="order-confirmation"]').should('be.visible');
    cy.get('[data-testid="qr-code"]').should('be.visible');
  });

  it('handles cart modifications', () => {
    cy.get('[data-testid="menu-button"]').click();

    // Add multiple items
    cy.get('[data-testid="menu-item"]').first().within(() => {
      cy.get('[data-testid="add-to-cart"]').click();
    });

    cy.get('[data-testid="menu-item"]').last().within(() => {
      cy.get('[data-testid="add-to-cart"]').click();
    });

    cy.get('[data-testid="cart-badge"]').should('contain', '2');

    // Modify quantities
    cy.get('[data-testid="cart-button"]').click();
    cy.get('[data-testid="quantity-increase"]').first().click();
    cy.get('[data-testid="quantity"]').first().should('contain', '2');

    // Remove item
    cy.get('[data-testid="remove-item"]').last().click();
    cy.get('[data-testid="cart-item"]').should('have.length', 1);
  });
});
```

### 2. Offline Functionality Tests

```javascript
// cypress/e2e/offline.cy.js
describe('Offline Functionality', () => {
  beforeEach(() => {
    cy.viewport('iphone-x');
  });

  it('loads cached menu when offline', () => {
    // Visit site while online to cache data
    cy.visit('/');
    cy.get('[data-testid="menu-button"]').click();
    
    // Wait for data to load
    cy.get('[data-testid="menu-item"]').should('have.length.greaterThan', 0);

    // Go offline
    cy.intercept('/api/menu', { forceNetworkError: true }).as('menuRequest');

    // Navigate away and back
    cy.get('[data-testid="home-button"]').click();
    cy.get('[data-testid="menu-button"]').click();

    // Menu should still load from cache
    cy.get('[data-testid="menu-item"]').should('have.length.greaterThan', 0);
  });

  it('queues orders when offline', () => {
    cy.visit('/');
    cy.get('[data-testid="menu-button"]').click();

    // Add item to cart
    cy.get('[data-testid="menu-item"]').first().within(() => {
      cy.get('[data-testid="add-to-cart"]').click();
    });

    cy.get('[data-testid="cart-button"]').click();
    cy.get('[data-testid="checkout-button"]').click();

    // Fill form
    cy.get('[data-testid="customer-name"]').type('Jane Doe');
    cy.get('[data-testid="customer-email"]').type('jane@example.com');
    cy.get('[data-testid="customer-phone"]').type('11888888888');
    cy.get('[data-testid="payment-pix"]').click();

    // Go offline before submitting
    cy.intercept('/api/orders', { forceNetworkError: true }).as('orderRequest');

    // Submit order
    cy.get('[data-testid="complete-order"]').click();

    // Should show offline message
    cy.get('[data-testid="offline-message"]').should('be.visible');
    cy.get('[data-testid="order-queued"]').should('be.visible');
  });
});
```

## Performance Testing

### 1. Lighthouse CI Integration

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/menu',
        'http://localhost:3000/checkout'
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'mobile',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4
        }
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
```

### 2. Load Testing (K6)

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
  },
};

export default function () {
  // Test main page
  let response = http.get('https://api.vai-coxinha.com/api/menu');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  // Test order creation
  let orderPayload = JSON.stringify({
    customerName: 'Load Test User',
    email: 'test@example.com',
    phone: '11999999999',
    items: [
      { productId: '1', quantity: 2, price: 5.90 }
    ],
    total: 11.80,
    paymentMethod: 'pix'
  });

  let orderResponse = http.post(
    'https://api.vai-coxinha.com/api/orders',
    orderPayload,
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(orderResponse, {
    'order created successfully': (r) => r.status === 201,
    'response has order id': (r) => JSON.parse(r.body).id !== undefined,
  });

  sleep(1);
}
```

## Security Testing

### 1. OWASP ZAP Integration

```yaml
# .github/workflows/security-test.yml
name: Security Testing

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Start application
        run: |
          npm install
          npm run build
          npm start &
          sleep 30
      
      - name: Run OWASP ZAP scan
        uses: zaproxy/action-full-scan@v0.4.0
        with:
          target: 'http://localhost:3000'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
      
      - name: Upload ZAP results
        uses: actions/upload-artifact@v2
        with:
          name: zap-results
          path: report_html.html
```

### 2. Security Unit Tests

```typescript
// Security test example
import { validateInput, sanitizeInput } from '../src/utils/security';

describe('Security Utils', () => {
  describe('validateInput', () => {
    it('validates email format', () => {
      expect(validateInput('test@example.com', 'email')).toBe(true);
      expect(validateInput('invalid-email', 'email')).toBe(false);
      expect(validateInput('test@', 'email')).toBe(false);
    });

    it('validates phone format', () => {
      expect(validateInput('+5511999999999', 'phone')).toBe(true);
      expect(validateInput('11999999999', 'phone')).toBe(true);
      expect(validateInput('invalid-phone', 'phone')).toBe(false);
    });

    it('validates SQL injection attempts', () => {
      expect(validateInput("'; DROP TABLE users; --", 'text')).toBe(false);
      expect(validateInput('<script>alert("xss")</script>', 'text')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('removes HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('Hello World');
    });

    it('escapes special characters', () => {
      const input = 'Hello "World" & Friends';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('Hello &quot;World&quot; &amp; Friends');
    });
  });
});
```

## Accessibility Testing

### 1. Automated Accessibility Tests

```typescript
// Accessibility test example
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import MenuPage from '../pages/menu';

expect.extend(toHaveNoViolations);

describe('Menu Page Accessibility', () => {
  test('menu page has no accessibility violations', async () => {
    const { container } = render(<MenuPage />);
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });

  test('menu items are keyboard navigable', () => {
    const { getAllByRole } = render(<MenuPage />);
    const menuItems = getAllByRole('article');
    
    menuItems.forEach(item => {
      expect(item).toHaveAttribute('tabindex', '0');
      expect(item).toHaveAttribute('role', 'article');
    });
  });

  test('images have alt text', () => {
    const { getAllByRole } = render(<MenuPage />);
    const images = getAllByRole('img');
    
    images.forEach(image => {
      expect(image).toHaveAttribute('alt');
      expect(image.getAttribute('alt')).not.toBe('');
    });
  });
});
```

### 2. Screen Reader Testing

```typescript
// Screen reader compatibility test
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Cart from '../components/Cart';

describe('Screen Reader Compatibility', () => {
  test('announces cart updates to screen readers', async () => {
    const { container } = render(<Cart />);
    
    // Add item to cart
    const addButton = screen.getByRole('button', { name: /add to cart/i });
    await userEvent.click(addButton);
    
    // Check if live region announces the update
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toHaveTextContent(/item added to cart/i);
  });

  test('provides proper form labels', () => {
    render(<CheckoutForm />);
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
  });
});
```

## Testing Tools and Configuration

### 1. Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/cypress/'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx'
  ]
};
```

### 2. Test Data Factories

```typescript
// test/factories/order.factory.ts
import { Order } from '../../src/orders/schemas/order.schema';

export const createMockOrder = (overrides?: Partial<Order>): Order => ({
  id: 'order123',
  customerName: 'John Doe',
  email: 'john@example.com',
  phone: '+5511999999999',
  items: [
    {
      productId: '1',
      name: 'Coxinha Tradicional',
      quantity: 2,
      price: 5.90,
      subtotal: 11.80
    }
  ],
  total: 11.80,
  status: 'pending',
  paymentMethod: 'pix',
  paymentStatus: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockProduct = (overrides?: Partial<Product>) => ({
  id: '1',
  name: 'Coxinha Tradicional',
  description: 'Delicious traditional coxinha',
  price: 5.90,
  category: 'tradicional',
  image: '/images/coxinha-tradicional.jpg',
  available: true,
  ...overrides
});
```

## Continuous Integration

### 1. GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x]
    
    services:
      mongodb:
        image: mongo:5
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci
          cd frontend && npm ci
          cd ../backend && npm ci
      
      - name: Run frontend tests
        run: |
          cd frontend
          npm run test:ci
          npm run test:coverage
      
      - name: Run backend tests
        run: |
          cd backend
          npm run test
          npm run test:coverage
      
      - name: Run E2E tests
        run: |
          npm run build
          npm run test:e2e
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          directory: ./coverage
          flags: unittests
          name: codecov-umbrella
```

## Testing Checklist

### Pre-deployment Testing
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance tests meet thresholds
- [ ] Security tests pass
- [ ] Accessibility tests pass
- [ ] Cross-browser testing completed
- [ ] Mobile device testing completed
- [ ] Offline functionality tested
- [ ] Payment flow tested

### Post-deployment Testing
- [ ] Smoke tests in production
- [ ] Performance monitoring
- [ ] Error tracking
- [ ] User feedback collection
- [ ] A/B testing setup
- [ ] Analytics verification

## Testing Best Practices

1. **Test Early and Often**: Write tests during development, not after
2. **Test Realistic Scenarios**: Use realistic test data and scenarios
3. **Mock External Dependencies**: Use mocks for external services
4. **Test Edge Cases**: Don't just test happy paths
5. **Keep Tests Fast**: Optimize test execution time
6. **Maintain Test Quality**: Regularly review and update tests
7. **Document Test Cases**: Document complex test scenarios
8. **Use Test Data Factories**: Create reusable test data generators
9. **Implement Test Coverage**: Aim for high but meaningful coverage
10. **Automate Everything**: Automate as much testing as possible
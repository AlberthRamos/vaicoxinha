import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

// Setup test database
beforeAll(async () => {
  // Run migrations
  execSync('npx prisma migrate deploy', {
    env: {
      ...process.env,
      DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/vai_coxinha_test',
    },
  })
})

// Clean up database before each test
beforeEach(async () => {
  const models = [
    'order_items',
    'orders',
    'cart_items',
    'carts',
    'product_categories',
    'products',
    'categories',
    'users',
  ]

  // Delete data in reverse order to respect foreign key constraints
  for (const model of models) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${model}" CASCADE`)
    } catch (error) {
      console.warn(`Could not truncate ${model}:`, error.message)
    }
  }
})

// Disconnect Prisma after all tests
afterAll(async () => {
  await prisma.$disconnect()
})

// Global test utilities
global.testUtils = {
  createUser: async (data = {}) => {
    return await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        phone: '+5511999999999',
        ...data,
      },
    })
  },

  createProduct: async (data = {}) => {
    return await prisma.product.create({
      data: {
        name: 'Test Product',
        description: 'Test Description',
        price: 10.99,
        image: 'test-image.jpg',
        available: true,
        ...data,
      },
    })
  },

  createOrder: async (userId, data = {}) => {
    return await prisma.order.create({
      data: {
        userId,
        total: 29.99,
        status: 'pending',
        paymentMethod: 'pix',
        deliveryAddress: {
          street: 'Test Street',
          number: '123',
          neighborhood: 'Test Neighborhood',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
        },
        ...data,
      },
    })
  },

  generateAuthToken: (userId) => {
    const jwt = require('jsonwebtoken')
    return jwt.sign(
      { userId, email: 'test@example.com' },
      process.env.ACCESS_TOKEN_SECRET || 'test-secret',
      { expiresIn: '15m' }
    )
  },

  createAuthenticatedUser: async () => {
    const user = await global.testUtils.createUser()
    const token = global.testUtils.generateAuthToken(user.id)
    return { user, token }
  },
}

// Extend global namespace for TypeScript
declare global {
  var testUtils: {
    createUser: (data?: any) => Promise<any>
    createProduct: (data?: any) => Promise<any>
    createOrder: (userId: string, data?: any) => Promise<any>
    generateAuthToken: (userId: string) => string
    createAuthenticatedUser: () => Promise<{ user: any; token: string }>
  }
}

export {}
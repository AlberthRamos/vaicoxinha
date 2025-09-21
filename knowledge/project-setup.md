# Project Setup Guide - Vai Coxinha PWA

## Overview
This guide provides step-by-step instructions for setting up the complete Vai Coxinha PWA development environment, including frontend, backend, and infrastructure components.

## Prerequisites

### System Requirements
- **Node.js**: 18.x LTS or higher
- **PostgreSQL**: 14.x or higher
- **Redis**: 6.x or higher (optional but recommended)
- **Docker**: 20.x or higher (optional)
- **Git**: 2.x or higher

### Development Tools
- **VS Code** with recommended extensions
- **Postman** or **Insomnia** for API testing
- **pgAdmin** or **DBeaver** for database management
- **Redis Insight** for Redis management

## Project Structure

```
vai-coxinha/
├── frontend/              # Next.js PWA
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   └── package.json
├── backend/               # Express.js API
│   ├── src/
│   ├── prisma/
│   ├── tests/
│   └── package.json
├── shared/                # Shared types and utilities
├── infrastructure/        # Docker, scripts, configs
├── knowledge/            # Documentation
└── docs/                 # API documentation
```

## Initial Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/vai-coxinha.git
cd vai-coxinha
```

### 2. Environment Configuration

#### Frontend Environment (.env.local)
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PWA_ENABLED=true
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_HOTJAR_ID=
```

#### Backend Environment (.env)
```bash
# backend/.env
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/vai_coxinha_dev

# JWT
ACCESS_TOKEN_SECRET=your-development-access-token-secret
REFRESH_TOKEN_SECRET=your-development-refresh-token-secret

# AWS S3 (Optional for development)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=vai-coxinha-dev

# MercadoPago (Optional for development)
MERCADOPAGO_ACCESS_TOKEN=

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=
LOG_LEVEL=debug
```

### 3. Database Setup

#### PostgreSQL Installation
```bash
# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download and install from https://www.postgresql.org/download/windows/
```

#### Database Creation
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE vai_coxinha_dev;
CREATE DATABASE vai_coxinha_test;

# Create user (optional)
CREATE USER vai_coxinha_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE vai_coxinha_dev TO vai_coxinha_user;
GRANT ALL PRIVILEGES ON DATABASE vai_coxinha_test TO vai_coxinha_user;

# Exit
\q
```

#### Redis Installation (Optional)
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Windows
# Download from https://redis.io/download
```

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install Additional Dependencies
```bash
# Core dependencies
npm install next@latest react@latest react-dom@latest
npm install typescript @types/node @types/react @types/react-dom

# UI and Styling
npm install tailwindcss postcss autoprefixer
npm install lucide-react

# State Management
npm install zustand

# Forms and Validation
npm install react-hook-form zod @hookform/resolvers

# HTTP Client
npm install axios

# PWA
npm install next-pwa

# Analytics
npm install @next/bundle-analyzer

# Development tools
npm install -D eslint prettier eslint-config-next
npm install -D @tailwindcss/forms @tailwindcss/typography
npm install -D cross-env
```

### 4. Configure Tailwind CSS
```bash
npx tailwindcss init -p
```

Update `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### 5. Initialize Next.js Configuration
Create `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'vai-coxinha.s3.amazonaws.com'],
  },
}

module.exports = nextConfig
```

### 6. Run Development Server
```bash
npm run dev
```

Frontend should be running at `http://localhost:3000`

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd ../backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install Additional Dependencies
```bash
# Core dependencies
npm install express cors helmet compression
npm install dotenv

# TypeScript
npm install -D typescript @types/express @types/cors @types/compression
npm install -D ts-node nodemon

# Database
npm install prisma @prisma/client

# Authentication
npm install jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken @types/bcryptjs

# Validation
npm install zod

# File Upload
npm install multer aws-sdk multer-s3
npm install -D @types/multer

# Payment Processing
npm install mercadopago stripe

# Cache
npm install redis ioredis

# Logging
npm install winston morgan
npm install -D @types/morgan

# Testing
npm install -D jest @types/jest supertest @types/supertest
npm install -D ts-jest

# Process Management
npm install -D pm2

# API Documentation
npm install swagger-jsdoc swagger-ui-express
npm install -D @types/swagger-jsdoc @types/swagger-ui-express
```

### 4. Initialize Prisma
```bash
npx prisma init
```

### 5. Configure TypeScript
Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 6. Create Project Structure
```bash
mkdir -p src/{controllers,services,repositories,middlewares,routes,validators,utils,types,config}
mkdir -p prisma/seeders
mkdir -p tests/{unit,integration}
mkdir -p logs
```

### 7. Database Migration
```bash
# Create database schema (copy from knowledge/database-schema.md)
# Then run:
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

### 8. Run Development Server
```bash
npm run dev
```

Backend should be running at `http://localhost:3001`

## Development Workflow

### 1. Git Configuration
```bash
# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Create .gitignore
cat > .gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
frontend/.next/
frontend/out/
backend/dist/
backend/build/

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output/

# Dependency directories
jspm_packages/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
EOF
```

### 2. Development Scripts

#### Frontend package.json
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "analyze": "cross-env ANALYZE=true next build",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

#### Backend package.json
```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "start:prod": "pm2 start ecosystem.config.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "db:migrate": "prisma migrate deploy",
    "db:generate": "prisma generate",
    "db:seed": "ts-node prisma/seeders/index.ts",
    "db:reset": "prisma migrate reset",
    "db:studio": "prisma studio",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix"
  }
}
```

### 3. Code Quality Setup

#### ESLint Configuration (Frontend)
```javascript
// frontend/.eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

#### ESLint Configuration (Backend)
```javascript
// backend/.eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:node/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "env": {
    "node": true,
    "es2020": true
  },
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "node/no-unsupported-features/es-syntax": "off"
  }
}
```

#### Prettier Configuration
```javascript
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### 4. Git Hooks Setup
```bash
# Install husky
npm install -D husky lint-staged

# Setup husky
npx husky install

# Create pre-commit hook
cat > .husky/pre-commit << EOF
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
EOF

# Create pre-push hook
cat > .husky/pre-push << EOF
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run type-check
npm run test
EOF

# Configure lint-staged
cat > .lintstagedrc.json << EOF
{
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
EOF
```

## Testing Setup

### 1. Frontend Testing
```bash
# Install testing dependencies
npm install -D jest @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Configure Jest
cat > jest.config.js << EOF
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)
EOF

# Create setup file
cat > jest.setup.js << EOF
import '@testing-library/jest-dom'
EOF
```

### 2. Backend Testing
```bash
# Install testing dependencies
npm install -D jest @types/jest supertest @types/supertest ts-jest

# Configure Jest
cat > jest.config.js << EOF
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
}
EOF

# Create test setup file
cat > tests/setup.ts << EOF
import { prisma } from '../src/prisma/client'

beforeEach(async () => {
  // Clean up database before each test
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
EOF
```

## Development Tools

### 1. VS Code Extensions
Install these recommended extensions:
- **ESLint**
- **Prettier**
- **TypeScript Hero**
- **Prisma**
- **Tailwind CSS IntelliSense**
- **Auto Rename Tag**
- **Bracket Pair Colorizer**
- **GitLens**
- **Thunder Client** (API testing)

### 2. VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

### 3. Database Tools
- **Prisma Studio**: `npx prisma studio`
- **pgAdmin**: GUI for PostgreSQL
- **TablePlus**: Modern database management tool

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
brew services list  # macOS
systemctl status postgresql  # Linux

# Restart PostgreSQL
brew services restart postgresql  # macOS
sudo systemctl restart postgresql  # Linux
```

#### 3. Node Modules Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### 4. Prisma Issues
```bash
# Reset Prisma
npx prisma generate
npx prisma migrate reset
npx prisma migrate dev
```

## Next Steps

After completing the setup:

1. **Review Documentation**: Check the knowledge base files for detailed implementation guides
2. **Start Development**: Begin with the frontend components and backend API endpoints
3. **Set up CI/CD**: Configure automated testing and deployment pipelines
4. **Configure Monitoring**: Set up error tracking and performance monitoring
5. **Security Audit**: Review security configurations and implement best practices

## Support

For issues and questions:
- Check the troubleshooting guide in `knowledge/troubleshooting-guide.md`
- Review the API documentation in `knowledge/api-documentation.md`
- Consult the deployment guide in `knowledge/deployment-guide.md`

This setup guide provides a solid foundation for developing the Vai Coxinha PWA. Follow the steps carefully and refer to the knowledge base documentation for detailed implementation guidance.
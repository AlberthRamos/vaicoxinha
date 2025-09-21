#!/bin/bash

echo "🍗 Iniciando deploy local do Vai Coxinha..."

# Criar arquivo de configuração para testes locais
cat > .env.local << EOF
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_BFF_URL=http://localhost:3001
NEXT_PUBLIC_ADMIN_URL=http://localhost:4004

# Backend Services
JWT_SECRET=vai-coxinha-secret-key-2024
MERCADOPAGO_TOKEN=TEST-1234567890
RABBITMQ_URL=amqp://localhost
REDIS_URL=redis://localhost:6379

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/vai_coxinha
EOF

echo "✅ Arquivo .env.local criado"

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
cd frontend
npm install
cd ..

# Instalar dependências dos serviços backend
echo "📦 Instalando dependências dos serviços backend..."
cd backend/services/bff
npm install
cd ../../..

cd backend/services/orders-service
npm install
cd ../../..

cd backend/services/admin-service
npm install
cd ../../..

echo "✅ Dependências instaladas"

# Criar banco de dados local (simulado)
echo "🗄️ Preparando banco de dados..."
mkdir -p backend/data
echo "{}" > backend/data/products.json
echo "{}" > backend/data/orders.json
echo "{}" > backend/data/users.json

echo "✅ Estrutura de dados criada"

# Iniciar serviços em background
echo "🚀 Iniciando serviços..."

# Terminal 1: Frontend
echo "Iniciando frontend na porta 3000..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Terminal 2: BFF Service
echo "Iniciando BFF na porta 3001..."
cd backend/services/bff && npm run dev &
BFF_PID=$!

# Terminal 3: Orders Service
echo "Iniciando Orders Service na porta 3002..."
cd backend/services/orders-service && npm run dev &
ORDERS_PID=$!

# Terminal 4: Admin Service
echo "Iniciando Admin Service na porta 4004..."
cd backend/services/admin-service && npm run dev &
ADMIN_PID=$!

echo "✅ Todos os serviços iniciados"
echo ""
echo "🍗 Vai Coxinha está rodando!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 BFF Service: http://localhost:3001"
echo "📦 Orders Service: http://localhost:3002"
echo "👨‍💼 Admin Service: http://localhost:4004"
echo ""
echo "Pressione Ctrl+C para parar todos os serviços"

# Aguardar interrupção
trap "kill $FRONTEND_PID $BFF_PID $ORDERS_PID $ADMIN_PID; exit" INT
wait
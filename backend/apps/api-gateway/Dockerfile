FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY apps/api-gateway ./apps/api-gateway
COPY libs ./libs

# Build da aplicação
RUN npm run build:api-gateway

# Expor porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "dist/apps/api-gateway/main"]
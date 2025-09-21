FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY apps/payments-service ./apps/payments-service
COPY libs ./libs

# Build da aplicação
RUN npm run build payments-service

# Expor porta
EXPOSE 3003

# Comando para iniciar a aplicação
CMD ["node", "dist/apps/payments-service/main"]

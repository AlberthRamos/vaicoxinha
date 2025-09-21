FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY apps/products-service ./apps/products-service
COPY libs ./libs

# Build da aplicação
RUN npm run build products-service

# Expor porta
EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["node", "dist/apps/products-service/main"]

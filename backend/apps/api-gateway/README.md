# API Gateway - Vai Coxinha

API Gateway para o sistema de pedidos Vai Coxinha, construído com NestJS.

## Funcionalidades

- **Autenticação**: Sistema de login/registro com JWT
- **Produtos**: Gerenciamento de produtos (coxinhas e bebidas)
- **Pedidos**: Criação e acompanhamento de pedidos
- **Pagamentos**: Processamento de pagamentos
- **Admin**: Dashboard administrativo com estatísticas

## Tecnologias

- NestJS
- TypeScript
- Swagger/OpenAPI
- JWT
- TCP Microservices

## Instalação

```bash
npm install
```

## Executando o projeto

### Desenvolvimento
```bash
npm run start:dev
```

### Produção
```bash
npm run build
npm run start:prod
```

## Documentação da API

A documentação Swagger está disponível em: `http://localhost:3000/api`

## Estrutura dos Microserviços

O API Gateway se comunica com os seguintes microserviços via TCP:

- **Products Service**: Porta 3001
- **Orders Service**: Porta 3002
- **Payments Service**: Porta 3003
- **Admin Service**: Porta 3004

## Variáveis de Ambiente

Copie o arquivo `.env.development` para `.env` e ajuste conforme necessário:

```bash
cp .env.development .env
```

## Endpoints Principais

### Autenticação
- `POST /auth/login` - Login de usuário
- `POST /auth/register` - Registro de novo usuário
- `GET /auth/profile` - Perfil do usuário logado

### Produtos
- `GET /products` - Listar produtos
- `GET /products/:id` - Buscar produto por ID
- `POST /products` - Criar novo produto (admin)
- `PUT /products/:id` - Atualizar produto (admin)
- `DELETE /products/:id` - Remover produto (admin)

### Pedidos
- `GET /orders` - Listar pedidos do usuário
- `GET /orders/:id` - Buscar pedido por ID
- `POST /orders` - Criar novo pedido
- `PUT /orders/:id/status` - Atualizar status do pedido

### Pagamentos
- `GET /payments` - Listar pagamentos
- `GET /payments/:id` - Buscar pagamento por ID
- `POST /payments` - Criar novo pagamento
- `PUT /payments/:id/process` - Processar pagamento

### Admin
- `GET /admin/dashboard` - Estatísticas do dashboard
- `GET /admin/users` - Listar todos os usuários
- `GET /admin/orders` - Listar todos os pedidos
- `GET /admin/revenue` - Estatísticas de receita

## Autenticação

A maioria dos endpoints admin requer autenticação via Bearer Token. Inclua o token no header:

```
Authorization: Bearer <seu-token-jwt>
```

## Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura de testes
npm run test:cov
```

## Suporte

Para problemas ou dúvidas, abra uma issue no repositório.
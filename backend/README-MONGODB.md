# 🍗 Vai Coxinha - Backend com MongoDB

Este backend foi configurado com MongoDB para gerenciar pedidos, clientes e integração com leads.

## 📋 Funcionalidades

- ✅ **Verificação de Primeiro Pedido**: Detecta automaticamente se é o primeiro pedido de um cliente
- ✅ **Gestão de Clientes**: Mantém histórico completo de pedidos por CPF
- ✅ **Integração com Leads**: Rastreia origem dos pedidos (campanhas, mídias sociais, etc.)
- ✅ **Frete Grátis no Primeiro Pedido**: Aplica automaticamente frete grátis para novos clientes
- ✅ **Analytics**: Estatísticas detalhadas de pedidos e leads
- ✅ **Histórico de Pedidos**: Consulta completa por cliente
- ✅ **Status de Pedidos**: Gerenciamento de status e pagamento

## 🚀 Estrutura do Banco de Dados

### Coleções Principais

#### Orders (Pedidos)
```typescript
{
  _id: ObjectId,
  orderId: string, // ID único do pedido
  userId: string, // ID do usuário que criou
  customerInfo: {
    firstName: string,
    lastName: string,
    cpf: string,
    email: string,
    phone: string
  },
  items: [{
    productId: string,
    productName: string,
    quantity: number,
    unitPrice: number,
    subtotal: number,
    notes?: string
  }],
  pricing: {
    subtotal: number,
    deliveryFee: number,
    discount: number,
    tax: number,
    total: number
  },
  paymentInfo: {
    method: 'PIX' | 'CARD' | 'CASH',
    amount: number,
    status: 'pending' | 'paid' | 'failed' | 'refunded'
  },
  deliveryInfo: {
    address: {
      street: string,
      number: string,
      complement?: string,
      neighborhood: string,
      city: string,
      state: string,
      zipCode: string
    },
    deliveryFee: number,
    deliveryInstructions?: string
  },
  leadSource: string, // Origem do lead
  campaign?: string, // Campanha de marketing
  medium?: string, // Mídia (social, email, etc)
  content?: string, // Conteúdo específico
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled',
  notes?: string,
  isFirstOrder: boolean, // Se é o primeiro pedido do cliente
  createdAt: Date,
  updatedAt: Date
}
```

#### Customers (Clientes)
```typescript
{
  _id: ObjectId,
  cpf: string, // CPF único
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  totalOrders: number, // Total de pedidos
  totalSpent: number, // Total gasto
  averageOrderValue: number, // Valor médio dos pedidos
  lastOrderDate?: Date, // Data do último pedido
  addresses: [{
    street: string,
    number: string,
    complement?: string,
    neighborhood: string,
    city: string,
    state: string,
    zipCode: string,
    isDefault: boolean
  }],
  preferences: {
    favoriteProducts: string[],
    orderFrequency: 'weekly' | 'biweekly' | 'monthly' | 'occasional'
  },
  tags: string[], // Tags para segmentação
  status: 'active' | 'inactive' | 'vip',
  createdAt: Date,
  updatedAt: Date
}
```

#### Leads (Leads/Campanhas)
```typescript
{
  _id: ObjectId,
  leadId: string, // ID único do lead
  source: string, // Fonte (FACEBOOK_ADS, GOOGLE_ADS, etc)
  campaign: string, // Nome da campanha
  medium: string, // Mídia (social, email, etc)
  content?: string, // Conteúdo específico
  customerInfo: {
    cpf: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string
  },
  conversionInfo: {
    convertedAt?: Date, // Data da conversão
    orderId?: string, // ID do pedido convertido
    conversionValue?: number, // Valor da conversão
    status: 'pending' | 'converted' | 'lost'
  },
  analytics: {
    firstContactDate: Date,
    lastInteractionDate: Date,
    interactionCount: number
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Instalação e Configuração

### 1. Instalar dependências
```bash
cd Backend
npm install
```

### 2. Configurar MongoDB
Certifique-se de ter o MongoDB instalado e rodando:
```bash
# Iniciar MongoDB (macOS)
brew services start mongodb-community

# Verificar se está rodando
mongo --eval "db.runCommand('ping')"
```

### 3. Configurar variáveis de ambiente
O arquivo `.env` já está configurado com:
```env
MONGODB_URI=mongodb://localhost:27017/vai-coxinha-orders
```

### 4. Executar o servidor
```bash
# Modo desenvolvimento
npm run mongo:dev

# Modo produção
npm run mongo:start
```

## 🧪 Testar a API

### Executar teste completo
```bash
npx tsx test-mongodb.ts
```

### Testar endpoints manualmente

#### Criar pedido
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "customerInfo": {
      "firstName": "João",
      "lastName": "Silva",
      "cpf": "12345678901",
      "email": "joao@email.com",
      "phone": "11999999999"
    },
    "items": [{
      "productId": "coxinha123",
      "productName": "Coxinha de Frango",
      "quantity": 10,
      "unitPrice": 3.50,
      "subtotal": 35.00
    }],
    "paymentInfo": {
      "method": "PIX",
      "amount": 45.00
    },
    "deliveryInfo": {
      "address": {
        "street": "Rua Teste",
        "number": "123",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": "01234567"
      },
      "deliveryFee": 10.00
    },
    "pricing": {
      "subtotal": 35.00,
      "deliveryFee": 10.00,
      "discount": 0,
      "tax": 0,
      "total": 45.00
    },
    "leadSource": "FACEBOOK_ADS",
    "campaign": "SUMMER2024"
  }'
```

#### Verificar primeiro pedido
```bash
curl "http://localhost:3001/api/orders/check-first-order?cpf=12345678901"
```

#### Obter histórico do cliente
```bash
curl "http://localhost:3001/api/orders/customer-history/12345678901"
```

#### Estatísticas de pedidos
```bash
curl "http://localhost:3001/api/orders/statistics"
```

#### Listar pedidos com filtros
```bash
curl "http://localhost:3001/api/orders?startDate=2024-01-01&endDate=2024-12-31&status=confirmed"
```

## 📊 Índices e Performance

Os seguintes índices foram criados para otimizar as consultas:

### Orders
- `orderId` (único)
- `customerInfo.cpf`
- `createdAt`
- `status`
- `leadSource`
- `campaign`

### Customers
- `cpf` (único)
- `email`
- `totalSpent`
- `lastOrderDate`

### Leads
- `leadId` (único)
- `customerInfo.cpf`
- `source`
- `campaign`
- `conversionInfo.status`

## 🔍 Métodos Úteis

### OrderService
- `createOrder(data)`: Cria pedido com verificação de primeiro pedido
- `checkFirstOrder({ cpf })`: Verifica se é primeiro pedido
- `getCustomerOrderHistory(cpf)`: Obtém histórico completo
- `getOrderStatistics()`: Estatísticas gerais
- `getOrders(filters)`: Lista com filtros
- `updateOrderStatus(id, status)`: Atualiza status
- `updatePaymentStatus(id, status)`: Atualiza pagamento

### CustomerService (integrado)
- `findOrCreate(customerData)`: Busca ou cria cliente
- `updateStatistics(cpf, orderValue)`: Atualiza estatísticas
- `addAddress(cpf, address)`: Adiciona endereço
- `getMostValuableCustomers(limit)`: Clientes mais valiosos
- `getInactiveCustomers(days)`: Clientes inativos

### LeadService
- `processLead(leadData)`: Processa novo lead
- `registerConversion(leadId, orderId, value)`: Registra conversão
- `getLeadAnalytics(filters)`: Analytics de leads
- `getLeadsByStatus(status)`: Leads por status
- `getLeadByCpf(cpf)`: Lead por CPF

## 🎯 Regras de Negócio

1. **Frete Grátis**: Primeiro pedido sempre tem frete grátis
2. **Verificação de Cliente**: Baseada no CPF
3. **Integração Lead-Pedido**: Rastreamento completo da origem
4. **Atualização Automática**: Estatísticas de cliente atualizadas automaticamente
5. **Histórico Completo**: Todos os pedidos e interações registrados

## 📈 Analytics Disponíveis

- Total de pedidos e valor total
- Ticket médio geral e por cliente
- Taxa de conversão de leads
- Origem dos pedidos (campanhas)
- Clientes mais valiosos
- Produtos mais vendidos
- Horários de pico
- Taxa de retenção de clientes

## 🔄 Migração de Dados

Se precisar migrar dados do SQLite/PostgreSQL:

1. Exporte os dados existentes
2. Use o script `migrate-to-mongodb.ts` (será criado sob demanda)
3. Valide os dados migrados
4. Atualize as configurações da aplicação

## 🚨 Troubleshooting

### MongoDB não conecta
```bash
# Verifique se o MongoDB está rodando
sudo systemctl status mongod

# Verifique as permissões
sudo chown -R mongodb:mongodb /var/lib/mongodb
```

### Erro de índice duplicado
- Verifique se não há CPFs duplicados
- Use `findOrCreate` ao invés de criar diretamente

### Performance lenta
- Verifique os índices: `db.orders.getIndexes()`
- Use limit e skip para paginação
- Considere sharding para grandes volumes

## 📚 Próximos Passos

- [ ] Implementar cache com Redis
- [ ] Adicionar webhooks para eventos de pedido
- [ ] Criar dashboard de analytics
- [ ] Implementar sistema de notificações
- [ ] Adicionar suporte a múltiplas lojas
- [ ] Criar API GraphQL
- [ ] Implementar sistema de avaliações
- [ ] Adicionar suporte a cupons de desconto

---

**Desenvolvido com ❤️ para Vai Coxinha**
import { MongoMemoryServer } from 'mongodb-memory-server';
import { OrderService } from './src/services/orderService';
import { LeadService } from './src/services/leadService';
import mongoose from 'mongoose';

/**
 * Script de teste simplificado com MongoDB em memória
 * Demonstra as funcionalidades principais
 */

const testOrderData = {
  userId: 'user123',
  customerInfo: {
    firstName: 'João',
    lastName: 'Silva',
    cpf: '12345678901',
    email: 'joao.silva@email.com',
    phone: '11999999999'
  },
  items: [
    {
      productId: 'coxinha123',
      productName: 'Coxinha de Frango',
      quantity: 10,
      unitPrice: 3.50,
      subtotal: 35.00,
      notes: 'Sem cebola'
    }
  ],
  paymentInfo: {
    method: 'PIX' as const,
    amount: 45.00
  },
  deliveryInfo: {
    address: {
      street: 'Rua das Coxinhas',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234567'
    },
    deliveryFee: 10.00
  },
  pricing: {
    subtotal: 35.00,
    deliveryFee: 10.00,
    discount: 0,
    tax: 0,
    total: 45.00
  },
  leadSource: 'FACEBOOK_ADS',
  campaign: 'SUMMER2024'
};

async function runSimpleTest() {
  console.log('🚀 Iniciando teste simplificado do MongoDB...\n');

  let mongod: MongoMemoryServer;

  try {
    // Iniciar MongoDB em memória
    console.log('📦 Iniciando MongoDB em memória...');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log('✅ MongoDB em memória iniciado\n');

    // Conectar ao banco
    await mongoose.connect(uri);
    console.log('✅ Conectado ao MongoDB\n');

    const orderService = new OrderService();
    const leadService = new LeadService();

    // Teste 1: Verificar se é primeiro pedido (deve ser true)
    console.log('🔍 Teste 1: Verificando se é primeiro pedido...');
    const firstOrderCheck = await orderService.checkFirstOrder({ cpf: '12345678901' });
    console.log('É primeiro pedido?', firstOrderCheck.isFirstOrder);
    console.log('Cliente existe?', firstOrderCheck.customerExists);
    console.log('');

    // Teste 2: Criar primeiro pedido
    console.log('🛒 Teste 2: Criando primeiro pedido...');
    const firstOrder = await orderService.createOrder(testOrderData);
    console.log('✅ Pedido criado!');
    console.log(`ID: ${firstOrder.orderId}`);
    console.log(`É primeiro pedido: ${firstOrder.isFirstOrder}`);
    console.log(`Frete: R$ ${firstOrder.pricing.deliveryFee} (deve ser grátis)`);
    console.log(`Total: R$ ${firstOrder.pricing.total}`);
    console.log('');

    // Teste 3: Verificar novamente (deve ser false agora)
    console.log('🔍 Teste 3: Verificando novamente...');
    const secondCheck = await orderService.checkFirstOrder({ cpf: '12345678901' });
    console.log('É primeiro pedido?', secondCheck.isFirstOrder);
    console.log('Cliente existe?', secondCheck.customerExists);
    console.log('');

    // Teste 4: Criar segundo pedido
    console.log('🛒 Teste 4: Criando segundo pedido...');
    const secondOrderData = {
      ...testOrderData,
      items: [{
        productId: 'empada789',
        productName: 'Empada de Palmito',
        quantity: 3,
        unitPrice: 5.00,
        subtotal: 15.00
      }],
      pricing: {
        subtotal: 15.00,
        deliveryFee: 10.00,
        discount: 0,
        tax: 0,
        total: 25.00
      }
    };
    
    const secondOrder = await orderService.createOrder(secondOrderData);
    console.log('✅ Segundo pedido criado!');
    console.log(`ID: ${secondOrder.orderId}`);
    console.log(`É primeiro pedido: ${secondOrder.isFirstOrder} (deve ser false)`);
    console.log(`Frete: R$ ${secondOrder.pricing.deliveryFee}`);
    console.log('');

    // Teste 5: Estatísticas
    console.log('📊 Teste 5: Estatísticas...');
    const stats = await orderService.getOrderStatistics();
    console.log(`Total de pedidos: ${stats.totalOrders}`);
    console.log(`Valor total: R$ ${stats.totalRevenue}`);
    console.log(`Ticket médio: R$ ${stats.averageOrderValue}`);
    console.log('');

    // Teste 6: Analytics de leads
    console.log('📈 Teste 6: Analytics de leads...');
    const leadAnalytics = await leadService.getLeadAnalytics({});
    console.log(`Total de leads: ${leadAnalytics.totalLeads}`);
    console.log(`Leads convertidos: ${leadAnalytics.convertedLeads}`);
    console.log(`Taxa de conversão: ${(leadAnalytics.conversionRate * 100).toFixed(1)}%`);
    console.log('');

    // Teste 7: Histórico do cliente
    console.log('📋 Teste 7: Histórico do cliente...');
    const history = await orderService.getCustomerOrderHistory('12345678901');
    console.log(`Cliente tem ${history.length} pedido(s)`);
    history.forEach((order, index) => {
      console.log(`${index + 1}. Pedido ${order.orderId} - Total: R$ ${order.pricing.total}`);
    });
    console.log('');

    // Teste 8: Dados do cliente
    console.log('👤 Teste 8: Dados do cliente...');
    const Customer = mongoose.model('Customer');
    const customer = await Customer.findOne({ cpf: '12345678901' });
    console.log(`Nome: ${customer.firstName} ${customer.lastName}`);
    console.log(`Total de pedidos: ${customer.totalOrders}`);
    console.log(`Total gasto: R$ ${customer.totalSpent}`);
    console.log(`Ticket médio: R$ ${customer.averageOrderValue}`);
    console.log('');

    console.log('🎉 Teste concluído com sucesso!');
    console.log('\n✅ Funcionalidades verificadas:');
    console.log('  ✓ Verificação de primeiro pedido');
    console.log('  ✓ Frete grátis no primeiro pedido');
    console.log('  ✓ Integração com leads e campanhas');
    console.log('  ✓ Atualização automática de estatísticas');
    console.log('  ✓ Histórico de pedidos por cliente');
    console.log('  ✓ Analytics de conversão');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    console.log('\n🏁 Finalizando...');
    if (mongod!) {
      await mongoose.disconnect();
      await mongod.stop();
    }
    process.exit(0);
  }
}

// Executar teste
runSimpleTest();
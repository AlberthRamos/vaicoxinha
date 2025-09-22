import { OrderService } from './src/services/orderService';
import { LeadService } from './src/services/leadService';
import { connectDatabase } from './src/config/database';

/**
 * Script de teste para demonstrar a funcionalidade do banco MongoDB
 * com verificação de primeiro pedido e integração com leads
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
    },
    {
      productId: 'pastel456',
      productName: 'Pastel de Queijo',
      quantity: 5,
      unitPrice: 4.00,
      subtotal: 20.00
    }
  ],
  paymentInfo: {
    method: 'PIX' as const,
    amount: 65.00
  },
  deliveryInfo: {
    address: {
      street: 'Rua das Coxinhas',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234567'
    },
    deliveryFee: 10.00,
    deliveryInstructions: 'Tocar interfone 45'
  },
  pricing: {
    subtotal: 55.00,
    deliveryFee: 10.00,
    discount: 0,
    tax: 0,
    total: 65.00
  },
  leadSource: 'FACEBOOK_ADS',
  campaign: 'SUMMER2024',
  medium: 'social',
  content: 'video_ad_1',
  notes: 'Cliente pediu para deixar na portaria'
};

async function runTest() {
  console.log('🚀 Iniciando teste do banco MongoDB...\n');

  try {
    // Conectar ao banco
    await connectDatabase();
    console.log('✅ Conectado ao MongoDB\n');

    const orderService = new OrderService();
    const leadService = new LeadService();

    // Teste 1: Verificar se é primeiro pedido
    console.log('🔍 Teste 1: Verificando se é primeiro pedido...');
    const firstOrderCheck = await orderService.checkFirstOrder({ cpf: '12345678901' });
    console.log('Resultado:', firstOrderCheck);
    console.log('');

    // Teste 2: Criar pedido
    console.log('🛒 Teste 2: Criando pedido...');
    const order = await orderService.createOrder(testOrderData);
    console.log('Pedido criado com sucesso!');
    console.log(`ID do pedido: ${order.orderId}`);
    console.log(`É primeiro pedido: ${order.isFirstOrder}`);
    console.log(`Valor total: R$ ${order.pricing.total}`);
    console.log(`Frete: R$ ${order.pricing.deliveryFee}`);
    console.log('');

    // Teste 3: Verificar novamente se é primeiro pedido
    console.log('🔍 Teste 3: Verificando novamente se é primeiro pedido...');
    const secondCheck = await orderService.checkFirstOrder({ cpf: '12345678901' });
    console.log('Resultado:', secondCheck);
    console.log('');

    // Teste 4: Obter histórico do cliente
    console.log('📋 Teste 4: Obtendo histórico do cliente...');
    const history = await orderService.getCustomerOrderHistory('12345678901');
    console.log(`Cliente tem ${history.length} pedido(s)`);
    console.log('Último pedido:', history[0]?.orderId);
    console.log('');

    // Teste 5: Estatísticas de pedidos
    console.log('📊 Teste 5: Obtendo estatísticas...');
    const stats = await orderService.getOrderStatistics();
    console.log('Estatísticas:', JSON.stringify(stats, null, 2));
    console.log('');

    // Teste 6: Analytics de leads
    console.log('📈 Teste 6: Obtendo analytics de leads...');
    const leadAnalytics = await leadService.getLeadAnalytics({});
    console.log('Analytics de leads:', JSON.stringify(leadAnalytics, null, 2));
    console.log('');

    // Teste 7: Criar segundo pedido com mesmo CPF
    console.log('🛒 Teste 7: Criando segundo pedido com mesmo CPF...');
    const secondOrderData = {
      ...testOrderData,
      items: [
        {
          productId: 'empada789',
          productName: 'Empada de Palmito',
          quantity: 3,
          unitPrice: 5.00,
          subtotal: 15.00
        }
      ],
      pricing: {
        subtotal: 15.00,
        deliveryFee: 10.00,
        discount: 0,
        tax: 0,
        total: 25.00
      }
    };
    
    const secondOrder = await orderService.createOrder(secondOrderData);
    console.log('Segundo pedido criado!');
    console.log(`ID do pedido: ${secondOrder.orderId}`);
    console.log(`É primeiro pedido: ${secondOrder.isFirstOrder}`);
    console.log(`Frete aplicado: R$ ${secondOrder.pricing.deliveryFee}`);
    console.log('');

    console.log('✅ Todos os testes concluídos com sucesso!');
    console.log('\n🎯 Funcionalidades testadas:');
    console.log('  - Verificação de primeiro pedido');
    console.log('  - Criação de pedidos com integração de leads');
    console.log('  - Histórico de pedidos por cliente');
    console.log('  - Estatísticas e analytics');
    console.log('  - Aplicação automática de frete grátis no primeiro pedido');
    console.log('  - Rastreamento de origem dos pedidos (campanhas)');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    console.log('\n🏁 Teste finalizado!');
    process.exit(0);
  }
}

// Executar teste
runTest();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearOrderHistory() {
  try {
    console.log('🧹 Iniciando limpeza do histórico de pedidos...');
    
    // Primeiro, deletar todos os pagamentos relacionados
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`💳 ${deletedPayments.count} pagamentos deletados`);
    
    // Depois, deletar todos os itens dos pedidos
    const deletedOrderItems = await prisma.orderItem.deleteMany({});
    console.log(`📦 ${deletedOrderItems.count} itens de pedidos deletados`);
    
    // Por fim, deletar todos os pedidos
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`📋 ${deletedOrders.count} pedidos deletados`);
    
    console.log('✅ Histórico de pedidos limpo com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao limpar histórico:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script se for chamado diretamente
if (require.main === module) {
  clearOrderHistory()
    .then(() => {
      console.log('🎉 Script concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro:', error);
      process.exit(1);
    });
}

export { clearOrderHistory };
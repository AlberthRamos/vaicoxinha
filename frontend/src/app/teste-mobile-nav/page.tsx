'use client';

import { MobileBottomNav } from '@/components/MobileBottomNav/MobileBottomNav';
import { CartProvider } from '@/contexts/CartContext';

export default function TesteMobileNavPage() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-center mb-8">Teste Navegação Mobile</h1>
          
          <div className="bg-white rounded-lg p-6 shadow mb-4">
            <h2 className="text-lg font-semibold mb-2">Conteúdo de Teste</h2>
            <p>Este é um conteúdo de teste para verificar a navegação mobile.</p>
            <p className="mt-2">A navegação deve aparecer na parte inferior da tela.</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow mb-4">
            <h2 className="text-lg font-semibold mb-2">Adicionar ao Carrinho</h2>
            <p>Teste o contador do carrinho na aba Cardápio.</p>
          </div>

          <div className="h-96 bg-blue-50 rounded-lg p-6 shadow">
            <h2 className="text-lg font-semibold mb-2">Espaço Extra</h2>
            <p>Este espaço adicional permite rolar a página para testar a navegação fixa.</p>
          </div>
        </div>
      </div>
      
      {/* O componente MobileBottomNav será renderizado aqui via layout.tsx */}
    </CartProvider>
  );
}
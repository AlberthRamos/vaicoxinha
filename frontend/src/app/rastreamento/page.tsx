'use client';

import { useState } from 'react';
import { Package, Search, AlertCircle } from 'lucide-react';
import OrderTracking from '@/components/OrderTracking';

export default function RastreamentoPage() {
  const [orderId, setOrderId] = useState('');
  const [trackingOrderId, setTrackingOrderId] = useState('');

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      setTrackingOrderId(orderId.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <Package className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rastrear Pedido</h1>
          <p className="text-gray-600">
            Acompanhe em tempo real o status da sua entrega
          </p>
        </div>

        {/* Order ID Input */}
        {!trackingOrderId && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <form onSubmit={handleTrackOrder} className="space-y-4">
              <div>
                <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-2">
                  Número do Pedido
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="orderId"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="Digite o número do seu pedido (ex: #12345)"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                  <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium mb-1">Como acompanhar seu pedido:</p>
                    <p>Para acompanhar o pedido em tempo real, insira o número do pedido que foi gerado no final da compra.</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                Rastrear Pedido
              </button>
            </form>
          </div>
        )}

        {/* Order Tracking */}
        {trackingOrderId && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Pedido {trackingOrderId}
              </h2>
              <button
                onClick={() => {
                  setTrackingOrderId('');
                  setOrderId('');
                }}
                className="text-orange-600 hover:text-orange-700 font-medium text-sm"
              >
                Rastrear outro pedido
              </button>
            </div>
            
            <OrderTracking orderId={trackingOrderId} />
          </div>
        )}


      </div>
    </div>
  );
}
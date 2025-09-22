'use client';

import { useState } from 'react';
import { Package, Clock, MapPin, Phone, RefreshCw, CheckCircle } from 'lucide-react';
import { useOrderTracking, OrderStatus } from '@/hooks/useOrderTracking';
import { UnifiedLoadingScreen } from '@/components/UnifiedLoadingScreen/UnifiedLoadingScreen';

interface OrderTrackingProps {
  orderId: string;
  className?: string;
}

export default function OrderTracking({ orderId, className = '' }: OrderTrackingProps) {
  const { order, loading, error, refreshOrder, statusConfig } = useOrderTracking(orderId);
  const [showMap, setShowMap] = useState(false);

  if (loading) {
    return <UnifiedLoadingScreen isLoading={true} context="order-tracking" />;
  }

  if (error || !order) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Package className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar pedido</h3>
          <p className="text-gray-600 mb-4">{error || 'Pedido não encontrado'}</p>
          <button
            onClick={refreshOrder}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const currentStatus = statusConfig[order.status];
  const progressPercentage = (Object.keys(statusConfig).indexOf(order.status) / (Object.keys(statusConfig).length - 1)) * 100;

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Acompanhamento do Pedido</h2>
              <p className="text-orange-100">Pedido #{order.id}</p>
            </div>
            <button
              onClick={refreshOrder}
              className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30"
              title="Atualizar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Status Progress */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{currentStatus.label}</span>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {order.estimatedTime > 0 ? `~${order.estimatedTime} min` : 'Entregue'}
                </span>
              </div>
            </div>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Timeline */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico do Pedido</h3>
            <div className="space-y-4">
              {order.timeline.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4"
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{item.status}</p>
                      <p className="text-sm text-gray-500">{item.time}</p>
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Status Card */}
          <div className={`${currentStatus.color} text-white rounded-lg p-4 mb-6`}>
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{currentStatus.icon}</div>
              <div>
                <h4 className="font-semibold">{currentStatus.label}</h4>
                <p className="text-sm opacity-90">{getStatusDescription(order.status)}</p>
              </div>
            </div>
          </div>

          {/* Delivery Person Info */}
          {order.status === 'delivering' && order.deliveryPerson && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Entregador</h4>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{order.deliveryPerson.name}</p>
                  <p className="text-sm text-gray-600">{order.deliveryPerson.phone}</p>
                </div>
                <button
                  onClick={() => window.open(`tel:${order.deliveryPerson?.phone}`)}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  title="Ligar para entregador"
                >
                  <Phone className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Location and Map */}
          {order.currentLocation && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Localização</h4>
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center space-x-2 text-orange-600 hover:text-orange-700"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {showMap ? 'Ocultar Mapa' : 'Ver Mapa'}
                  </span>
                </button>
              </div>
              
              {showMap && (
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center mb-3">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Mapa em tempo real</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Lat: {order.currentLocation?.lat.toFixed(4)}, Lng: {order.currentLocation?.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>Endereço:</strong> {order.currentLocation.address}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              onClick={refreshOrder}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Atualizar</span>
            </button>
            {order.deliveryPerson?.phone && (
              <button
                onClick={() => window.open(`tel:${order.deliveryPerson.phone}`)}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Phone className="w-4 h-4" />
                <span>Ligar para entregador</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusDescription(status: OrderStatus): string {
  const descriptions: Record<OrderStatus, string> = {
    'pending': 'Seu pedido foi recebido e está sendo preparado',
    'confirmed': 'Seu pedido foi confirmado e será preparado em breve',
    'preparing': 'Seu pedido está sendo preparado com carinho',
    'ready': 'Seu pedido está pronto! Aguarde o entregador',
    'delivering': 'Seu pedido está a caminho!',
    'delivered': 'Pedido entregue com sucesso!',
    'cancelled': 'Pedido cancelado'
  };
  return descriptions[status];
}
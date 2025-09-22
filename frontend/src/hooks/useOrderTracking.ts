import { useState, useEffect } from 'react';

export interface OrderStatus {
  id: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'dispatched' | 'delivering' | 'delivered';
  estimatedTime: number; // minutes
  currentLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  deliveryPerson?: {
    name: string;
    phone: string;
    photo: string;
  };
  timeline: Array<{
    time: string;
    status: string;
    description: string;
    completed: boolean;
  }>;
}

const SIMULATED_ORDER_PROGRESSION = {
  pending: { next: 'confirmed', delay: 2000 },
  confirmed: { next: 'preparing', delay: 5000 },
  preparing: { next: 'dispatched', delay: 8000 },
  dispatched: { next: 'delivering', delay: 3000 },
  delivering: { next: 'delivered', delay: 10000 },
  delivered: { next: null, delay: 0 }
};

const STATUS_CONFIG = {
  pending: { label: 'Pedido Realizado', color: 'bg-yellow-500', icon: '📋' },
  confirmed: { label: 'Pedido Confirmado', color: 'bg-blue-500', icon: '✅' },
  preparing: { label: 'Em Preparação', color: 'bg-orange-500', icon: '👨‍🍳' },
  dispatched: { label: 'Saiu para Entrega', color: 'bg-purple-500', icon: '🚚' },
  delivering: { label: 'Em Rota de Entrega', color: 'bg-green-500', icon: '🏃‍♂️' },
  delivered: { label: 'Entregue', color: 'bg-green-600', icon: '📦' }
};

export function useOrderTracking(orderId: string) {
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate fetching order data
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockOrder: OrderStatus = {
          id: orderId,
          status: 'pending',
          estimatedTime: 45,
          currentLocation: {
            lat: -23.5505,
            lng: -46.6333,
            address: 'Rua Exemplo, 123 - São Paulo, SP'
          },
          deliveryPerson: {
            name: 'João Silva',
            phone: '(11) 98765-4321',
            photo: '/api/placeholder/100/100'
          },
          timeline: [
            {
              time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              status: 'Pedido Realizado',
              description: 'Seu pedido foi recebido',
              completed: true
            }
          ]
        };
        
        setOrder(mockOrder);
      } catch (err) {
        setError('Erro ao carregar dados do pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // Simulate order status progression
  useEffect(() => {
    if (!order || order.status === 'delivered') return;

    const progressOrder = async () => {
      const currentConfig = SIMULATED_ORDER_PROGRESSION[order.status];
      if (!currentConfig.next) return;

      await new Promise(resolve => setTimeout(resolve, currentConfig.delay));

      setOrder(prevOrder => {
        if (!prevOrder) return null;

        const newStatus = currentConfig.next as OrderStatus['status'];
        const newTimelineItem = {
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: STATUS_CONFIG[newStatus].label,
          description: getStatusDescription(newStatus),
          completed: true
        };

        return {
          ...prevOrder,
          status: newStatus,
          estimatedTime: Math.max(0, prevOrder.estimatedTime - Math.floor(currentConfig.delay / 60000)),
          timeline: [...prevOrder.timeline, newTimelineItem]
        };
      });
    };

    progressOrder();
  }, [order?.status]);

  // Simulate delivery person location updates
  useEffect(() => {
    if (!order || order.status !== 'delivering') return;

    const updateLocation = () => {
      setOrder(prevOrder => {
        if (!prevOrder || !prevOrder.currentLocation) return prevOrder;

        // Simulate movement towards delivery address
        const newLat = prevOrder.currentLocation.lat + (Math.random() - 0.5) * 0.001;
        const newLng = prevOrder.currentLocation.lng + (Math.random() - 0.5) * 0.001;

        return {
          ...prevOrder,
          currentLocation: {
            ...prevOrder.currentLocation,
            lat: newLat,
            lng: newLng
          }
        };
      });
    };

    const interval = setInterval(updateLocation, 3000);
    return () => clearInterval(interval);
  }, [order?.status]);

  const refreshOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In a real app, this would fetch fresh data
    } catch (err) {
      setError('Erro ao atualizar pedido');
    } finally {
      setLoading(false);
    }
  };

  return {
    order,
    loading,
    error,
    refreshOrder,
    statusConfig: STATUS_CONFIG
  };
}

function getStatusDescription(status: OrderStatus['status']): string {
  const descriptions = {
    pending: 'Seu pedido foi recebido',
    confirmed: 'Seu pedido foi confirmado',
    preparing: 'Seu pedido está sendo preparado',
    dispatched: 'Seu pedido saiu para entrega',
    delivering: 'Seu pedido está a caminho',
    delivered: 'Seu pedido foi entregue'
  };
  return descriptions[status];
}
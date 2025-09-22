'use client';

import { useState, useEffect } from 'react';
import { MapPin, Clock, Phone, Package, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

export default function DeliveryPage() {
  const [cep, setCep] = useState('');
  const [isCheckingCep, setIsCheckingCep] = useState(false);
  const [cepStatus, setCepStatus] = useState<'idle' | 'available' | 'unavailable'>('idle');

  const performanceMetrics = usePerformanceMonitor();

  const deliveryInfo = [
    {
      icon: Truck,
      title: 'Entrega Expressa',
      description: 'Entrega em até 30-45 minutos para toda São Paulo',
      color: 'text-orange-500'
    },
    {
      icon: Clock,
      title: 'Horário de Funcionamento',
      description: 'Segunda a Sábado: 9h às 21h | Domingo: 10h às 20h',
      color: 'text-orange-500'
    },
    {
      icon: MapPin,
      title: 'Área de Cobertura',
      description: 'Atendemos toda a cidade de São Paulo e Grande São Paulo',
      color: 'text-orange-500'
    },
    {
      icon: CreditCard,
      title: 'Pagamento Facilitado',
      description: 'Cartão, PIX, dinheiro e parcelamento em até 3x',
      color: 'text-orange-500'
    }
  ];

  const deliverySteps = [
    {
      step: 1,
      title: 'Faça seu Pedido',
      description: 'Escolha seus salgados favoritos e adicione ao carrinho'
    },
    {
      step: 2,
      title: 'Confirme Endereço',
      description: 'Informe seu CEP e confirme o endereço de entrega'
    },
    {
      step: 3,
      title: 'Pagamento',
      description: 'Escolha a forma de pagamento mais conveniente'
    },
    {
      step: 4,
      title: 'Rastreamento',
      description: 'Acompanhe seu pedido em tempo real até a entrega'
    }
  ];

  const coverageAreas = [
    { region: 'Centro', neighborhoods: ['Sé', 'República', 'Bela Vista', 'Consolação'], deliveryTime: '25-35 min' },
    { region: 'Zona Sul', neighborhoods: ['Vila Mariana', 'Moema', 'Itaim Bibi', 'Brooklin'], deliveryTime: '30-40 min' },
    { region: 'Zona Norte', neighborhoods: ['Santana', 'Tucuruvi', 'Jaçanã', 'Vila Medeiros'], deliveryTime: '35-45 min' },
    { region: 'Zona Leste', neighborhoods: ['Tatuapé', 'Mooca', 'Penha', 'Itaquera'], deliveryTime: '35-45 min' },
    { region: 'Zona Oeste', neighborhoods: ['Pinheiros', 'Vila Madalena', 'Butantã', 'Barra Funda'], deliveryTime: '30-40 min' },
    { region: 'Grande SP', neighborhoods: ['Osasco', 'Carapicuíba', 'São Caetano', 'Santo André'], deliveryTime: '40-50 min' }
  ];

  const handleCepCheck = async () => {
    if (!cep || cep.length !== 9) return;
    
    setIsCheckingCep(true);

    try {
      // Simulate CEP check
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simple validation: odd CEPs are available, even are not (for demo)
      const isAvailable = parseInt(cep.replace('-', '')) % 2 === 1;
      setCepStatus(isAvailable ? 'available' : 'unavailable');
    } catch (error) {
      console.error('Erro ao verificar CEP:', error);
      setCepStatus('unavailable');
    } finally {
      setIsCheckingCep(false);
    }
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                Entrega Rápida & Confiável
              </h1>
              <p className="text-xl lg:text-2xl text-orange-100 max-w-3xl mx-auto">
                Entregamos seus salgados fresquinhos em toda São Paulo com agilidade e segurança
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CEP Checker */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Verifique sua Área</h2>
            <p className="text-gray-600">Informe seu CEP para verificar se atendemos sua região</p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(formatCep(e.target.value))}
                placeholder="00000-000"
                maxLength={9}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button
                onClick={handleCepCheck}
                disabled={isCheckingCep || cep.length !== 9}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCheckingCep ? 'Verificando...' : 'Verificar'}
              </button>
            </div>

            <div>
              {cepStatus === 'available' && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-orange-600" />
                    <span className="font-semibold">Atendemos sua região!</span>
                  </div>
                  <p className="text-sm mt-1">Tempo estimado de entrega: 30-45 minutos</p>
                </div>
              )}
              
              {cepStatus === 'unavailable' && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-600" />
                    <span className="font-semibold">CEP Não Atendido</span>
                  </div>
                  <p className="text-sm mt-1">Estamos expandindo! Entre em contato para saber mais.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Por que nossa entrega é diferente?</h2>
            <p className="text-gray-600">Entrega rápida, segura e com rastreamento em tempo real</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {deliveryInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <div key={index} className="text-center bg-white rounded-lg p-6 hover:shadow-lg transition-shadow duration-300">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4`}>
                    <Icon className={`w-8 h-8 ${info.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{info.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{info.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delivery Steps */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Como funciona nossa entrega?</h2>
            <p className="text-gray-600">Simples, rápido e transparente</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {deliverySteps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-500 text-white font-bold text-lg mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coverage Areas */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Áreas de Cobertura</h2>
            <p className="text-gray-600">Atendemos toda São Paulo com eficiência</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coverageAreas.map((area, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{area.region}</h3>
                  <span className="text-sm font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">
                    {area.deliveryTime}
                  </span>
                </div>
                <div className="space-y-1">
                  {area.neighborhoods.map((neighborhood, idx) => (
                    <div key={idx} className="text-sm text-gray-600">
                      • {neighborhood}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Pronto para experimentar?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Faça seu pedido agora e receba os melhores salgados artesanais em casa
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-orange-500 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
              Fazer Pedido Agora
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-500">
              Ver Cardápio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
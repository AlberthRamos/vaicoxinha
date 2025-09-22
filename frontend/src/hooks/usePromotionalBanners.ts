import { useState, useEffect } from 'react';

export interface PromotionalBanner {
  id: string;
  title: string;
  description: string;
  image: string;
  backgroundColor: string;
  textColor: string;
  buttonText: string;
  buttonColor: string;
  link: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  priority: number;
}

export function usePromotionalBanners() {
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock promotional banners
        const mockBanners: PromotionalBanner[] = [
          {
            id: 'banner-1',
            title: '🎉 Promoção de Lançamento!',
            description: 'Primeira compra com 20% OFF em todos os salgados',
            image: '/api/placeholder/400/200',
            backgroundColor: 'bg-gradient-to-r from-orange-500 to-red-500',
            textColor: 'text-white',
            buttonText: 'Aproveitar Agora',
            buttonColor: 'bg-white text-orange-600 hover:bg-gray-100',
            link: '/cardapio?promo=launch20',
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            isActive: true,
            priority: 1
          },
          {
            id: 'banner-2',
            title: '📦 Frete Grátis',
            description: 'Em pedidos acima de R$ 50,00 para toda a cidade',
            image: '/api/placeholder/400/200',
            backgroundColor: 'bg-gradient-to-r from-green-500 to-blue-500',
            textColor: 'text-white',
            buttonText: 'Ver Condições',
            buttonColor: 'bg-white text-green-600 hover:bg-gray-100',
            link: '/delivery#frete',
            startDate: new Date(),
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
            isActive: true,
            priority: 2
          },
          {
            id: 'banner-3',
            title: '⏰ Entrega Expressa',
            description: 'Receba em até 30 minutos em áreas selecionadas',
            image: '/api/placeholder/400/200',
            backgroundColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
            textColor: 'text-white',
            buttonText: 'Consultar Área',
            buttonColor: 'bg-white text-purple-600 hover:bg-gray-100',
            link: '/rastreamento',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            isActive: true,
            priority: 3
          }
        ];
        
        setBanners(mockBanners);
      } catch (err) {
        setError('Erro ao carregar banners promocionais');
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const getActiveBanners = (): PromotionalBanner[] => {
    const now = new Date();
    return banners
      .filter(banner => 
        banner.isActive && 
        banner.startDate <= now && 
        banner.endDate >= now
      )
      .sort((a, b) => a.priority - b.priority);
  };

  const getBannerById = (id: string): PromotionalBanner | undefined => {
    return banners.find(banner => banner.id === id);
  };

  return {
    banners: getActiveBanners(),
    loading,
    error,
    getBannerById
  };
}
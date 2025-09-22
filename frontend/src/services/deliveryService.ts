// Serviço de Cálculo de Frete Nacional para Delivery
// Integração com geocoding e filiais regionais

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface RegionalBranch {
  id: string;
  name: string;
  address: Address;
  coordinates: {
    lat: number;
    lng: number;
  };
  baseFee: number;
  coverageRadius: number; // em km
  maxDeliveryDistance: number; // em km
  active: boolean;
}

export interface DeliveryFee {
  baseFee: number;
  distanceFee: number;
  totalFee: number;
  distance: number; // em km
  branch: RegionalBranch;
  estimatedTime: number; // em minutos
}

export interface GeocodingResult {
  formattedAddress: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  confidence: number;
  components: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

// Base de dados das filiais regionais
const REGIONAL_BRANCHES: RegionalBranch[] = [
  {
    id: 'sp-centro',
    name: 'São Paulo - Centro',
    address: {
      street: 'Rua da Consolação',
      number: '1000',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01302-907',
      country: 'Brasil'
    },
    coordinates: { lat: -23.5505, lng: -46.6333 },
    baseFee: 8.00,
    coverageRadius: 25,
    maxDeliveryDistance: 50,
    active: true
  },
  {
    id: 'rj-centro',
    name: 'Rio de Janeiro - Centro',
    address: {
      street: 'Avenida Rio Branco',
      number: '100',
      neighborhood: 'Centro',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zipCode: '20040-007',
      country: 'Brasil'
    },
    coordinates: { lat: -22.9068, lng: -43.1729 },
    baseFee: 9.00,
    coverageRadius: 20,
    maxDeliveryDistance: 40,
    active: true
  },
  {
    id: 'bh-centro',
    name: 'Belo Horizonte - Centro',
    address: {
      street: 'Avenida Afonso Pena',
      number: '1000',
      neighborhood: 'Centro',
      city: 'Belo Horizonte',
      state: 'MG',
      zipCode: '30130-008',
      country: 'Brasil'
    },
    coordinates: { lat: -19.9167, lng: -43.9345 },
    baseFee: 7.50,
    coverageRadius: 18,
    maxDeliveryDistance: 35,
    active: true
  },
  {
    id: 'poa-centro',
    name: 'Porto Alegre - Centro',
    address: {
      street: 'Avenida Borges de Medeiros',
      number: '1500',
      neighborhood: 'Centro',
      city: 'Porto Alegre',
      state: 'RS',
      zipCode: '90119-900',
      country: 'Brasil'
    },
    coordinates: { lat: -30.0346, lng: -51.2177 },
    baseFee: 8.50,
    coverageRadius: 22,
    maxDeliveryDistance: 45,
    active: true
  },
  {
    id: 'brasilia-centro',
    name: 'Brasília - Centro',
    address: {
      street: 'Esplanada dos Ministérios',
      number: '100',
      neighborhood: 'Centro',
      city: 'Brasília',
      state: 'DF',
      zipCode: '70050-900',
      country: 'Brasil'
    },
    coordinates: { lat: -15.7801, lng: -47.9292 },
    baseFee: 10.00,
    coverageRadius: 30,
    maxDeliveryDistance: 60,
    active: true
  }
];

export class DeliveryService {
  private static instance: DeliveryService;
  private geocodingCache = new Map<string, GeocodingResult>();

  static getInstance(): DeliveryService {
    if (!this.instance) {
      this.instance = new DeliveryService();
    }
    return this.instance;
  }

  /**
   * Geocoding: Padroniza e valida o endereço do cliente
   */
  async geocodeAddress(address: Partial<Address>): Promise<GeocodingResult> {
    try {
      // Simulação de geocoding - em produção, usar API como Google Maps, Nominatim, etc.
      const addressString = this.formatAddressString(address);
      
      // Verificar cache
      if (this.geocodingCache.has(addressString)) {
        return this.geocodingCache.get(addressString)!;
      }

      // Simular chamada de API
      await this.simulateApiDelay();

      // Geocoding simulado baseado na cidade/estado
      const result = this.simulateGeocoding(address);
      
      // Armazenar em cache
      this.geocodingCache.set(addressString, result);
      
      return result;
    } catch (error) {
      throw new Error(`Erro ao geocodificar endereço: ${error}`);
    }
  }

  /**
   * Identifica a filial mais próxima do endereço do cliente
   */
  findNearestBranch(customerCoordinates: { lat: number; lng: number }): RegionalBranch {
    const activeBranches = REGIONAL_BRANCHES.filter(branch => branch.active);
    
    if (activeBranches.length === 0) {
      throw new Error('Nenhuma filial ativa disponível');
    }

    let nearestBranch = activeBranches[0];
    let minDistance = this.calculateDistance(
      customerCoordinates.lat,
      customerCoordinates.lng,
      activeBranches[0].coordinates.lat,
      activeBranches[0].coordinates.lng
    );

    for (const branch of activeBranches) {
      const distance = this.calculateDistance(
        customerCoordinates.lat,
        customerCoordinates.lng,
        branch.coordinates.lat,
        branch.coordinates.lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestBranch = branch;
      }
    }

    return nearestBranch;
  }

  /**
   * Calcula o frete completo em tempo real
   */
  async calculateDeliveryFee(
    customerAddress: Partial<Address>
  ): Promise<DeliveryFee> {
    try {
      // 1. Geocoding do endereço do cliente
      const geocodedAddress = await this.geocodeAddress(customerAddress);
      
      // 2. Encontrar filial mais próxima
      const nearestBranch = this.findNearestBranch(geocodedAddress.coordinates);
      
      // 3. Calcular distância real
      const distance = this.calculateDistance(
        geocodedAddress.coordinates.lat,
        geocodedAddress.coordinates.lng,
        nearestBranch.coordinates.lat,
        nearestBranch.coordinates.lng
      );

      // 4. Validar cobertura
      if (distance > nearestBranch.maxDeliveryDistance) {
        throw new Error(`Endereço fora da área de entrega (máximo: ${nearestBranch.maxDeliveryDistance}km)`);
      }

      // 5. Calcular taxas
      const baseFee = nearestBranch.baseFee;
      const distanceFee = this.calculateDistanceFee(distance, nearestBranch);
      const totalFee = baseFee + distanceFee;
      
      // 6. Calcular tempo estimado
      const estimatedTime = this.calculateEstimatedTime(distance, nearestBranch);

      return {
        baseFee,
        distanceFee,
        totalFee,
        distance,
        branch: nearestBranch,
        estimatedTime
      };
    } catch (error) {
      throw new Error(`Erro ao calcular frete: ${error}`);
    }
  }

  /**
   * Calcula a taxa de distância baseada na política de preços
   */
  private calculateDistanceFee(distance: number, branch: RegionalBranch): number {
    const distanceInKm = distance;
    
    // Política de taxa progressiva por distância
    if (distanceInKm <= branch.coverageRadius * 0.5) {
      return 0; // Dentro do raio básico: sem taxa adicional
    } else if (distanceInKm <= branch.coverageRadius) {
      return 3.00; // Raio intermediário: taxa baixa
    } else if (distanceInKm <= branch.coverageRadius * 1.5) {
      return 6.00; // Raio estendido: taxa média
    } else {
      // Distância extra: taxa progressiva
      const extraDistance = distanceInKm - (branch.coverageRadius * 1.5);
      const extraFee = extraDistance * 1.50; // R$ 1,50 por km adicional
      return 6.00 + extraFee;
    }
  }

  /**
   * Calcula o tempo estimado de entrega
   */
  private calculateEstimatedTime(distance: number, branch: RegionalBranch): number {
    const baseTime = 30; // 30 minutos base
    const distanceTime = Math.ceil(distance * 3); // 3 minutos por km
    const preparationTime = 15; // 15 minutos de preparação
    
    return baseTime + distanceTime + preparationTime;
  }

  /**
   * Calcula distância entre dois pontos (fórmula de Haversine)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Formata o endereço para string
   */
  private formatAddressString(address: Partial<Address>): string {
    const parts = [
      address.street,
      address.number,
      address.neighborhood,
      address.city,
      address.state,
      address.zipCode
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  /**
   * Simula geocoding baseado na cidade/estado
   */
  private simulateGeocoding(address: Partial<Address>): GeocodingResult {
    // Coordenadas simuladas baseadas em cidades principais
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {
      'são paulo': { lat: -23.5505, lng: -46.6333 },
      'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
      'belo horizonte': { lat: -19.9167, lng: -43.9345 },
      'porto alegre': { lat: -30.0346, lng: -51.2177 },
      'brasília': { lat: -15.7801, lng: -47.9292 },
      'curitiba': { lat: -25.4284, lng: -49.2733 },
      'salvador': { lat: -12.9714, lng: -38.5014 },
      'fortaleza': { lat: -3.7172, lng: -38.5434 },
      'recife': { lat: -8.0476, lng: -34.8770 }
    };

    const city = address.city?.toLowerCase() || 'são paulo';
    const coordinates = cityCoordinates[city] || { lat: -23.5505, lng: -46.6333 };

    return {
      formattedAddress: this.formatAddressString(address),
      coordinates,
      confidence: 0.8,
      components: {
        street: address.street || '',
        number: address.number || '',
        neighborhood: address.neighborhood || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || ''
      }
    };
  }

  /**
   * Simula delay de API
   */
  private async simulateApiDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
  }

  /**
   * Valida se o CEP está dentro da área de cobertura
   */
  async validateCoverage(zipCode: string): Promise<boolean> {
    try {
      // Simular validação de CEP
      await this.simulateApiDelay();
      
      // Remove caracteres não numéricos
      const cleanCep = zipCode.replace(/\D/g, '');
      
      // Validar formato e faixa de CEPs atendidos
      if (cleanCep.length !== 8) {
        return false;
      }

      // Simular cobertura nacional (em produção, usar API de CEP)
      const coveredRanges = [
        { start: '01000000', end: '59999999' }, // SP, RJ, MG, etc.
        { start: '70000000', end: '79999999' }, // DF, GO, etc.
        { start: '80000000', end: '89999999' }, // PR, SC, RS
        { start: '40000000', end: '49999999' }  // BA, SE, AL, etc.
      ];

      return coveredRanges.some(range => 
        cleanCep >= range.start && cleanCep <= range.end
      );
    } catch (error) {
      console.error('Erro ao validar cobertura:', error);
      return false;
    }
  }
}

// Hook React para uso fácil
export function useDeliveryService() {
  const deliveryService = DeliveryService.getInstance();
  
  const calculateDeliveryFee = async (address: Partial<Address>) => {
    return await deliveryService.calculateDeliveryFee(address);
  };

  const validateCoverage = async (zipCode: string) => {
    return await deliveryService.validateCoverage(zipCode);
  };

  const geocodeAddress = async (address: Partial<Address>) => {
    return await deliveryService.geocodeAddress(address);
  };

  return {
    calculateDeliveryFee,
    validateCoverage,
    geocodeAddress
  };
}

export default DeliveryService;
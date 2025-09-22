import React, { useState, useEffect } from 'react';
import { MapPin, User, Home, Hash, Building, Mail, AlertCircle } from 'lucide-react';

export interface AddressFormData {
  firstName: string;
  lastName: string;
  street: string;
  number: string;
  complement?: string;
  apartment?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface AddressFormProps {
  onAddressChange: (address: AddressFormData) => void;
  initialData?: Partial<AddressFormData>;
  onValidationChange?: (isValid: boolean) => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ 
  onAddressChange, 
  initialData,
  onValidationChange 
}) => {
  const [formData, setFormData] = useState<AddressFormData>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    street: initialData?.street || '',
    number: initialData?.number || '',
    complement: initialData?.complement || '',
    apartment: initialData?.apartment || '',
    neighborhood: initialData?.neighborhood || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zipCode: initialData?.zipCode || '',
    country: initialData?.country || 'Brasil'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Estados do Brasil
  const brazilianStates = [
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' },
    { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' },
    { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' }
  ];

  // Detectar estado pela localização
  const detectStateFromLocation = async () => {
    setIsLoadingLocation(true);
    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        // Simular detecção de estado baseada na localização
        // Em produção, usar API de geocoding reversa
        const { latitude, longitude } = position.coords;
        
        // Lógica simplificada para detectar estado baseado em coordenadas
        let detectedState = 'SP'; // Default São Paulo
        
        if (latitude < -25) detectedState = 'RS';
        else if (latitude < -22 && longitude < -50) detectedState = 'PR';
        else if (latitude < -22 && longitude > -50) detectedState = 'SC';
        else if (latitude < -20) detectedState = 'RJ';
        else if (latitude < -18) detectedState = 'MG';
        else if (latitude < -15) detectedState = 'SP';
        else if (latitude < -10) detectedState = 'GO';
        else if (latitude < -5) detectedState = 'DF';
        else detectedState = 'BA';

        setFormData(prev => ({ ...prev, state: detectedState }));
      }
    } catch (error) {
      console.error('Erro ao detectar localização:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Detectar estado automaticamente ao montar o componente
  useEffect(() => {
    if (!formData.state) {
      detectStateFromLocation();
    }
  }, []);

  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Campos obrigatórios do cliente
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Nome é obrigatório';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Sobrenome é obrigatório';
    }

    // Campos obrigatórios do endereço
    if (!formData.street.trim()) {
      newErrors.street = 'Rua é obrigatória';
    }
    if (!formData.number.trim()) {
      newErrors.number = 'Número é obrigatório';
    }
    if (!formData.neighborhood.trim()) {
      newErrors.neighborhood = 'Bairro é obrigatório';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'Cidade é obrigatória';
    }
    if (!formData.state) {
      newErrors.state = 'Estado é obrigatório';
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'CEP é obrigatório';
    } else if (!/^\d{5}-?\d{3}$/.test(formData.zipCode.replace(/\D/g, ''))) {
      newErrors.zipCode = 'CEP inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manipular mudanças nos campos
  const handleInputChange = (field: keyof AddressFormData, value: string) => {
    let formattedValue = value;

    // Formatar CEP
    if (field === 'zipCode') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
    }

    // Formatar número (permitir apenas números e letras)
    if (field === 'number') {
      formattedValue = value.replace(/[^\da-zA-Z]/g, '').slice(0, 10);
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  // Validar e notificar mudanças
  useEffect(() => {
    const isValid = validateForm();
    if (onValidationChange) {
      onValidationChange(isValid);
    }
    onAddressChange(formData);
  }, [formData, onAddressChange, onValidationChange]);

  return (
    <div className="space-y-6">
      {/* Seção de Dados Pessoais */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center mb-4">
          <User className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Dados Pessoais</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Seu nome"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sobrenome *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Seu sobrenome"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.lastName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Seção de Endereço */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <MapPin className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Endereço de Entrega</h3>
          </div>
          <button
            type="button"
            onClick={detectStateFromLocation}
            disabled={isLoadingLocation}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {isLoadingLocation ? 'Detectando...' : '📍 Detectar localização'}
          </button>
        </div>

        <div className="space-y-4">
          {/* CEP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.zipCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
              {errors.zipCode && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.zipCode}
                </p>
              )}
            </div>

            {/* Estado */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado *
              </label>
              <select
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.state ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione o estado</option>
                {brazilianStates.map(state => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.state}
                </p>
              )}
            </div>

            {/* Cidade */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.city ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Sua cidade"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.city}
                </p>
              )}
            </div>
          </div>

          {/* Rua e Número */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rua *
              </label>
              <div className="relative">
                <Home className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.street ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nome da rua"
                />
              </div>
              {errors.street && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.street}
                </p>
              )}
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número *
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nº"
                />
              </div>
              {errors.number && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.number}
                </p>
              )}
            </div>
          </div>

          {/* Complemento e Apartamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complemento (opcional)
              </label>
              <input
                type="text"
                value={formData.complement}
                onChange={(e) => handleInputChange('complement', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Casa, Fundos, Loja"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apartamento (opcional)
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.apartment}
                  onChange={(e) => handleInputChange('apartment', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Bloco A, Apto 201"
                />
              </div>
            </div>
          </div>

          {/* Bairro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bairro *
            </label>
            <input
              type="text"
              value={formData.neighborhood}
              onChange={(e) => handleInputChange('neighborhood', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.neighborhood ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nome do bairro"
            />
            {errors.neighborhood && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.neighborhood}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Resumo do Endereço */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Resumo do Endereço:</h4>
        <p className="text-sm text-blue-800">
          {formData.street && formData.number ? (
            `${formData.street}, ${formData.number}${
              formData.complement ? ` - ${formData.complement}` : ''
            }${
              formData.apartment ? ` - ${formData.apartment}` : ''
            }`
          ) : 'Endereço incompleto'}
        </p>
        <p className="text-sm text-blue-800">
          {formData.neighborhood && formData.city && formData.state ? (
            `${formData.neighborhood}, ${formData.city} - ${formData.state}, ${formData.zipCode}`
          ) : 'Localização incompleta'}
        </p>
        <p className="text-sm text-blue-800 font-medium">
          {formData.firstName && formData.lastName ? (
            `Destinatário: ${formData.firstName} ${formData.lastName}`
          ) : 'Nome do destinatário incompleto'}
        </p>
      </div>
    </div>
  );
};

export default AddressForm;
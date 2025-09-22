'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Calculator, MapPin, Clock, CheckCircle, AlertCircle, Navigation } from 'lucide-react';
import { useDeliveryService, DeliveryFee } from '@/services/deliveryService';
import AddressForm, { AddressFormData } from '../AddressForm/AddressForm';

interface DeliveryCalculatorProps {
  onDeliveryCalculated?: (fee: number) => void;
  onCustomerDataChange?: (data: AddressFormData) => void;
  className?: string;
}

export default function DeliveryCalculator({ 
  onDeliveryCalculated, 
  onCustomerDataChange,
  className = '' 
}: DeliveryCalculatorProps) {
  const [address, setAddress] = useState<AddressFormData>({
    firstName: '',
    lastName: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Brasil'
  });
  const [customerData, setCustomerData] = useState({ firstName: '', lastName: '' });
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState<DeliveryFee | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string>('');
  const [isValid, setIsValid] = useState(false);

  const deliveryService = useDeliveryService();

  const handleAddressChange = (data: AddressFormData) => {
    setAddress(data);
    setCustomerData({
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    if (onCustomerDataChange) {
      onCustomerDataChange(data);
    }
  };

  const handleAddressValidation = (isValid: boolean) => {
    setIsAddressValid(isValid);
  };

  const calculateDelivery = async () => {
    if (!isAddressValid) {
      setError('Por favor, preencha todos os campos obrigatórios do endereço');
      return;
    }

    setIsCalculating(true);
    setError('');

    try {
      const result = await deliveryService.calculateDeliveryFee(address);
      
      setDeliveryResult(result);
      setIsValid(true);
      if (onDeliveryCalculated) {
        onDeliveryCalculated(result.totalFee);
      }
    } catch (err) {
      setError('Erro ao calcular frete. Tente novamente.');
      setIsValid(false);
      if (onDeliveryCalculated) {
        onDeliveryCalculated(0);
      }
    } finally {
      setIsCalculating(false);
    }
  };

  // Calcular frete automaticamente quando o endereço for válido
  useEffect(() => {
    if (isAddressValid && address.street && address.number && address.neighborhood && address.city && address.state) {
      const timeoutId = setTimeout(() => {
        calculateDelivery();
      }, 1000); // Delay de 1 segundo para evitar muitas requisições

      return () => clearTimeout(timeoutId);
    }
  }, [address, isAddressValid]);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <Truck className="w-6 h-6 mr-2 text-orange-500" />
        Calcular Frete de Entrega
      </h3>

      {/* Formulário de Endereço Completo */}
      <div className="mb-6">
        <AddressForm 
          onAddressChange={handleAddressChange}
          onValidationChange={handleAddressValidation}
          initialData={address}
        />
      </div>

      {/* Resultado do Cálculo */}
      {isCalculating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <Calculator className="w-5 h-5 text-blue-600 mr-2 animate-spin" />
            <span className="text-blue-800">Calculando frete...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {deliveryResult && isValid && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800 font-semibold">Frete calculado com sucesso!</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Filial mais próxima:</p>
              <p className="font-medium text-black">{deliveryResult.branch.name}</p>
            </div>
            
            <div>
              <p className="text-gray-600">Distância:</p>
              <p className="font-medium text-black">{deliveryResult.distance.toFixed(1)} km</p>
            </div>
            
            <div>
              <p className="text-gray-600">Tempo estimado:</p>
              <p className="font-medium text-black flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {deliveryResult.estimatedTime} min
              </p>
            </div>
            
            <div>
              <p className="text-gray-600">Taxa de entrega:</p>
              <p className="font-bold text-orange-600 text-lg">
                R$ {deliveryResult.totalFee.toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-green-200">
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                Ver detalhamento do frete
              </summary>
              <div className="mt-2 space-y-1">
                <p className="flex justify-between">
                  <span>Taxa base:</span>
                  <span>R$ {deliveryResult.baseFee.toFixed(2)}</span>
                </p>
                <p className="flex justify-between">
                  <span>Taxa por distância:</span>
                  <span>R$ {deliveryResult.distanceFee.toFixed(2)}</span>
                </p>
                <p className="flex justify-between font-semibold border-t pt-1">
                  <span>Total:</span>
                  <span>R$ {deliveryResult.totalFee.toFixed(2)}</span>
                </p>
              </div>
            </details>
          </div>
        </div>
      )}

      {/* Botão de recálculo manual */}
      <button
        onClick={calculateDelivery}
        disabled={isCalculating || !isAddressValid}
        className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        <Calculator className="w-5 h-5 mr-2" />
        {isCalculating ? 'Calculando...' : 'Calcular Frete'}
      </button>

      {/* Informações adicionais */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>* O frete é calculado automaticamente conforme você preenche o endereço</p>
        <p>* Taxas podem variar conforme a distância da filial mais próxima</p>
      </div>
    </div>
  );
}
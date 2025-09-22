'use client';

import React from 'react';
import { MapPin, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';

interface LocationCaptureProps {
  onLocationChange?: (location: { latitude: number; longitude: number; address: string }) => void;
  showAddress?: boolean;
  compact?: boolean;
  className?: string;
}

export function LocationCapture({ 
  onLocationChange, 
  showAddress = true, 
  compact = false,
  className = '' 
}: LocationCaptureProps) {
  const { latitude, longitude, address, isLoading, error, permission, getCurrentPosition } = useGeolocation();

  React.useEffect(() => {
    if (latitude && longitude && address && onLocationChange) {
      onLocationChange({ latitude, longitude, address });
    }
  }, [latitude, longitude, address, onLocationChange]);

  const handleRefresh = () => {
    getCurrentPosition();
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-gray-500" />
        ) : error ? (
          <AlertCircle className="w-4 h-4 text-red-500" />
        ) : latitude && longitude ? (
          <div className="flex items-center gap-1" title={address || 'Endereço detectado'}>
            <MapPin className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-600 truncate max-w-32">
              {address ? address.split(',')[0] : 'Endereço detectado'}
            </span>
          </div>
        ) : permission === 'denied' ? (
          <div className="flex items-center gap-1">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-gray-600">Permissão negada</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-600">Sem localização</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Localização</h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          title="Atualizar localização"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5" />
          <span>Obtendo localização...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-medium">Erro ao obter localização</p>
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
      ) : latitude && longitude ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-700">Endereço detectado</span>
          </div>
          {showAddress && address && (
            <div className="ml-7">
              <p className="text-sm text-gray-800 font-medium">{address}</p>
            </div>
          )}
        </div>
      ) : permission === 'denied' ? (
        <div className="flex items-center gap-3 text-orange-600">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-medium">Permissão negada</p>
            <p className="text-sm text-orange-500">
              Ative a permissão de localização nas configurações do navegador
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-gray-600">
          <MapPin className="w-5 h-5" />
          <div>
            <p className="font-medium">Localização não disponível</p>
            <p className="text-sm text-gray-500">
              Clique em atualizar para tentar obter sua localização
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
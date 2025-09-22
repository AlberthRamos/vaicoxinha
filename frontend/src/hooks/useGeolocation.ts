'use client';

import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  isLoading: boolean;
  error: string | null;
  permission: 'granted' | 'denied' | 'prompt' | null;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const [location, setLocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    address: null,
    isLoading: false,
    error: null,
    permission: null,
  });

  const getAddressFromCoords = async (latitude: number, longitude: number): Promise<string> => {
    try {
      // Using Nominatim API (OpenStreetMap) - free and doesn't require API key
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to get address');
      }
      
      const data = await response.json();
      
      if (data.display_name) {
        // Format the address to show only relevant parts
        const address = data.address;
        let formattedAddress = '';
        
        if (address.road) {
          formattedAddress += address.road;
          if (address.house_number) {
            formattedAddress += ', ' + address.house_number;
          }
        }
        
        if (address.neighbourhood || address.suburb) {
          formattedAddress += ' - ' + (address.neighbourhood || address.suburb);
        }
        
        if (address.city || address.town) {
          formattedAddress += ', ' + (address.city || address.town);
        }
        
        return formattedAddress || data.display_name;
      }
      
      return 'Endereço não disponível';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Endereço não disponível';
    }
  };

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocalização não é suportada pelo seu navegador',
        isLoading: false,
      }));
      return;
    }

    setLocation(prev => ({ ...prev, isLoading: true, error: null }));

    const successCallback = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      
      try {
        // Get address from coordinates
        const address = await getAddressFromCoords(latitude, longitude);
        
        setLocation({
          latitude,
          longitude,
          address,
          isLoading: false,
          error: null,
          permission: 'granted',
        });
      } catch (error) {
        setLocation({
          latitude,
          longitude,
          address: 'Endereço não disponível',
          isLoading: false,
          error: null,
          permission: 'granted',
        });
      }
    };

    const errorCallback = (error: GeolocationPositionError) => {
      let errorMessage = 'Erro ao obter localização';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Permissão de localização negada';
          setLocation(prev => ({ ...prev, permission: 'denied' }));
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Localização indisponível';
          break;
        case error.TIMEOUT:
          errorMessage = 'Tempo limite excedido';
          break;
        default:
          errorMessage = 'Erro desconhecido';
      }
      
      setLocation(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    };

    navigator.geolocation.getCurrentPosition(
      successCallback,
      errorCallback,
      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 10000,
        maximumAge: options.maximumAge ?? 0,
      }
    );
  };

  const requestPermission = async () => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocalização não é suportada pelo seu navegador',
      }));
      return;
    }

    // Check if we already have permission
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setLocation(prev => ({ ...prev, permission: result.state as any }));
        
        if (result.state === 'granted') {
          getCurrentPosition();
        } else if (result.state === 'prompt') {
          getCurrentPosition(); // This will trigger the permission prompt
        }
      } catch (error) {
        // Fallback for browsers that don't support permissions API
        getCurrentPosition();
      }
    } else {
      // Fallback for older browsers
      getCurrentPosition();
    }
  };

  useEffect(() => {
    // Auto-request location on mount
    requestPermission();
  }, []);

  const clearLocation = () => {
    setLocation({
      latitude: null,
      longitude: null,
      address: null,
      isLoading: false,
      error: null,
      permission: null,
    });
  };

  return {
    ...location,
    getCurrentPosition,
    requestPermission,
    clearLocation,
  };
}
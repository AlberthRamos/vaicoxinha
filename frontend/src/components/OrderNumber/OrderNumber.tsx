import React, { useState, useEffect } from 'react';
import { Barcode, Copy, Check } from 'lucide-react';

interface OrderNumberProps {
  orderNumber?: string;
  onOrderGenerated?: (orderNumber: string) => void;
  showCopyButton?: boolean;
}

export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString().slice(-8);
  const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
  const checkDigit = Math.floor(Math.random() * 10);
  
  return `VCX${timestamp}${randomPart}${checkDigit}`;
};

const OrderNumber: React.FC<OrderNumberProps> = ({ 
  orderNumber, 
  onOrderGenerated, 
  showCopyButton = true 
}) => {
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (orderNumber) {
      setCurrentOrderNumber(orderNumber);
    } else {
      // Gerar novo número de pedido
      const newOrderNumber = generateOrderNumber();
      setCurrentOrderNumber(newOrderNumber);
      if (onOrderGenerated) {
        onOrderGenerated(newOrderNumber);
      }
    }
  }, [orderNumber, onOrderGenerated]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentOrderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Barcode className="w-6 h-6 text-blue-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-blue-900">Número do Pedido</p>
            <p className="text-lg font-mono font-bold text-blue-800 tracking-wider">
              {currentOrderNumber}
            </p>
          </div>
        </div>
        
        {showCopyButton && (
          <button
            onClick={copyToClipboard}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Copiar
              </>
            )}
          </button>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t border-blue-200">
        <p className="text-xs text-blue-600">
          💡 Guarde este número para rastrear seu pedido
        </p>
      </div>
    </div>
  );
};

export default OrderNumber;
'use client';

import { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Check, AlertCircle } from 'lucide-react';
import MercadoPagoPayment from '@/components/MercadoPagoPayment/MercadoPagoPayment';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    cpf: string;
    address?: {
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  onPaymentComplete: (paymentResult: any) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  orderId,
  amount,
  customerInfo,
  onPaymentComplete
}: PaymentModalProps) {
  const [paymentStep, setPaymentStep] = useState<'payment' | 'processing' | 'success' | 'error'>('payment');
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setPaymentStep('payment');
      setPaymentResult(null);
      setError('');
    }
  }, [isOpen]);

  const handlePaymentSuccess = (result: any) => {
    setPaymentResult(result);
    setPaymentStep('success');
    setTimeout(() => {
      onPaymentComplete(result);
      onClose();
    }, 3000);
  };

  const handlePaymentPending = (result: any) => {
    setPaymentResult(result);
    setPaymentStep('processing');
    // Iniciar verificação de status
    startStatusCheck(result.id);
  };

  const handlePaymentError = (error: any) => {
    setError(error.message || 'Erro ao processar pagamento');
    setPaymentStep('error');
  };

  const startStatusCheck = (paymentId: string) => {
    // Verificar status a cada 5 segundos por até 2 minutos
    let attempts = 0;
    const maxAttempts = 24; // 2 minutos / 5 segundos
    
    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        setError('Tempo limite excedido. Por favor, tente novamente.');
        setPaymentStep('error');
        return;
      }

      try {
        // Aqui você implementaria a lógica para verificar o status do pagamento
        // Por enquanto, vamos simular uma verificação
        attempts++;
        
        // Simular verificação de status (remover em produção)
        if (attempts > 3) { // Simular aprovação após 15 segundos
          setPaymentStep('success');
          setTimeout(() => {
            onPaymentComplete({ status: 'approved', id: paymentId });
            onClose();
          }, 2000);
          return;
        }

        setTimeout(checkStatus, 5000);
      } catch (error) {
        console.error('Erro ao verificar status:', error);
        setTimeout(checkStatus, 5000);
      }
    };

    checkStatus();
  };

  const renderContent = () => {
    switch (paymentStep) {
      case 'payment':
        return (
          <MercadoPagoPayment
            orderId={orderId}
            amount={amount}
            customerInfo={customerInfo}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            onPaymentPending={handlePaymentPending}
          />
        );

      case 'processing':
        return (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Processando Pagamento</h3>
            <p className="text-gray-600">Aguarde enquanto processamos seu pagamento...</p>
            {paymentResult?.qrCode && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>PIX:</strong> Se você escaneou o QR Code, aguarde a confirmação.
                </p>
              </div>
            )}
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Pagamento Aprovado!</h3>
            <p className="text-gray-600 mb-4">Seu pagamento foi processado com sucesso.</p>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-600">
                <strong>ID do Pagamento:</strong> {paymentResult?.id}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Valor:</strong> R$ {amount.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Método:</strong> {paymentResult?.paymentMethod === 'credit_card' ? 'Cartão' : 'PIX'}
              </p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Erro no Pagamento</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => setPaymentStep('payment')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {paymentStep === 'payment' && 'Pagamento'}
            {paymentStep === 'processing' && 'Processando'}
            {paymentStep === 'success' && 'Sucesso'}
            {paymentStep === 'error' && 'Erro'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={paymentStep === 'processing'}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
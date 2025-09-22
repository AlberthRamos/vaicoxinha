'use client';

import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, QrCode, Loader2, Check, AlertCircle } from 'lucide-react';
import { paymentService, PaymentMethod, PaymentData, CustomerInfo, CardData, PixData } from '@/services/paymentService';

interface MercadoPagoPaymentProps {
  orderId: string;
  amount: number;
  customerInfo: CustomerInfo;
  onPaymentSuccess: (paymentResult: any) => void;
  onPaymentError: (error: any) => void;
  onPaymentPending: (paymentResult: any) => void;
}

export default function MercadoPagoPayment({
  orderId,
  amount,
  customerInfo,
  onPaymentSuccess,
  onPaymentError,
  onPaymentPending
}: MercadoPagoPaymentProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CREDIT_CARD);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardData, setCardData] = useState<Partial<CardData>>({});
  const [pixData, setPixData] = useState<PixData>({});
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [copiaCola, setCopiaCola] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (paymentMethod === PaymentMethod.PIX && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [paymentMethod, countdown]);

  const handleCardPayment = async () => {
    if (!cardData.cardNumber || !cardData.cardholderName || !cardData.expiryMonth || 
        !cardData.expiryYear || !cardData.cvv || !cardData.identificationNumber) {
      alert('Por favor, preencha todos os dados do cartão');
      return;
    }

    if (!paymentService.validateCardNumber(cardData.cardNumber)) {
      alert('Número do cartão inválido');
      return;
    }

    if (!paymentService.validateExpiryDate(cardData.expiryMonth!, cardData.expiryYear!)) {
      alert('Data de validade inválida');
      return;
    }

    if (!paymentService.validateCVV(cardData.cvv!)) {
      alert('CVV inválido');
      return;
    }

    setIsProcessing(true);

    try {
      const paymentData: PaymentData = {
        orderId,
        amount,
        paymentMethod,
        customerInfo,
        cardData: cardData as CardData,
        installments: 1
      };

      const result = await paymentService.processPayment(paymentData);
      setPaymentResult(result);

      if (result.status === 'approved') {
        onPaymentSuccess(result);
      } else if (result.status === 'pending') {
        onPaymentPending(result);
      } else {
        onPaymentError(result);
      }
    } catch (error) {
      console.error('Erro no pagamento com cartão:', error);
      onPaymentError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePixPayment = async () => {
    setIsProcessing(true);

    try {
      const paymentData: PaymentData = {
        orderId,
        amount,
        paymentMethod: PaymentMethod.PIX,
        customerInfo,
        pixData: {
          expiresIn: 3600 // 1 hora
        }
      };

      const result = await paymentService.processPayment(paymentData);
      setPaymentResult(result);

      if (result.qrCode) {
        setQrCode(result.qrCode);
        setCopiaCola(result.qrCodeBase64 || '');
        setCountdown(3600); // 1 hora em segundos
      }

      if (result.status === 'approved') {
        onPaymentSuccess(result);
      } else if (result.status === 'pending') {
        onPaymentPending(result);
      } else {
        onPaymentError(result);
      }
    } catch (error) {
      console.error('Erro no pagamento com PIX:', error);
      onPaymentError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(copiaCola);
    alert('Código PIX copiado para a área de transferência!');
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Pagamento via Mercado Pago</h2>

      {/* Seleção de Método de Pagamento */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Escolha a forma de pagamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setPaymentMethod(PaymentMethod.CREDIT_CARD)}
            className={`p-4 border-2 rounded-lg flex items-center justify-center space-x-3 transition-all ${
              paymentMethod === PaymentMethod.CREDIT_CARD
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            disabled={isProcessing}
          >
            <CreditCard className="w-6 h-6" />
            <span className="font-medium">Cartão de Crédito/Débito</span>
          </button>
          
          <button
            onClick={() => setPaymentMethod(PaymentMethod.PIX)}
            className={`p-4 border-2 rounded-lg flex items-center justify-center space-x-3 transition-all ${
              paymentMethod === PaymentMethod.PIX
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            disabled={isProcessing}
          >
            <QrCode className="w-6 h-6" />
            <span className="font-medium">PIX</span>
          </button>
        </div>
      </div>

      {/* Formulário de Cartão */}
      {paymentMethod === PaymentMethod.CREDIT_CARD && (
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número do Cartão
              </label>
              <input
                type="text"
                placeholder="0000 0000 0000 0000"
                value={cardData.cardNumber || ''}
                onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isProcessing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome no Cartão
              </label>
              <input
                type="text"
                placeholder="NOME COMPLETO"
                value={cardData.cardholderName || ''}
                onChange={(e) => setCardData({ ...cardData, cardholderName: e.target.value.toUpperCase() })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isProcessing}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mês
              </label>
              <input
                type="text"
                placeholder="MM"
                value={cardData.expiryMonth || ''}
                onChange={(e) => setCardData({ ...cardData, expiryMonth: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isProcessing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ano
              </label>
              <input
                type="text"
                placeholder="AA"
                value={cardData.expiryYear || ''}
                onChange={(e) => setCardData({ ...cardData, expiryYear: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isProcessing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVV
              </label>
              <input
                type="text"
                placeholder="000"
                value={cardData.cvv || ''}
                onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isProcessing}
              />
            </div>
          </div>
        </div>
      )}

      {/* QR Code PIX */}
      {paymentMethod === PaymentMethod.PIX && qrCode && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center mb-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Escaneie o QR Code</h4>
            <p className="text-sm text-gray-600 mb-4">
              Use o app do seu banco para escanear este código QR
            </p>
            
            {countdown > 0 && (
              <div className="mb-4">
                <div className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  <Clock className="w-4 h-4 mr-1" />
                  Expira em: {formatTime(countdown)}
                </div>
              </div>
            )}
            
            <div className="flex justify-center mb-4">
              <img 
                src={`data:image/png;base64,${qrCode}`} 
                alt="QR Code PIX" 
                className="w-48 h-48 border-2 border-gray-200 rounded-lg"
              />
            </div>
            
            <button
              onClick={copyPixCode}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Copiar código PIX
            </button>
          </div>
        </div>
      )}

      {/* Botão de Pagamento */}
      <div className="space-y-4">
        <button
          onClick={paymentMethod === PaymentMethod.CREDIT_CARD ? handleCardPayment : handlePixPayment}
          disabled={isProcessing || (paymentMethod === PaymentMethod.PIX && qrCode)}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processando...</span>
            </>
          ) : paymentMethod === PaymentMethod.PIX && qrCode ? (
            <>
              <Check className="w-5 h-5" />
              <span>Aguardando pagamento PIX</span>
            </>
          ) : (
            <>
              {paymentMethod === PaymentMethod.CREDIT_CARD ? <CreditCard className="w-5 h-5" /> : <QrCode className="w-5 h-5" />}
              <span>Pagar R$ {amount.toFixed(2)}</span>
            </>
          )}
        </button>
        
        <div className="flex items-center justify-center text-sm text-gray-500">
          <AlertCircle className="w-4 h-4 mr-1" />
          <span>Pagamento seguro via Mercado Pago</span>
        </div>
      </div>
    </div>
  );
}
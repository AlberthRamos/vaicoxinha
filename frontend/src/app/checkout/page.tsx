"use client";
import { useEffect, useState } from 'react';
import { Card, Typography, Button, Result, message, Checkbox } from 'antd';
import { useSearchParams } from 'next/navigation';
import { apiGet, apiPost } from '@/utils/api';

export default function CheckoutPage() {
  const params = useSearchParams();
  const id = params.get('id');
  const [order, setOrder] = useState<any>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiGet(`/api/orders/${id}`).then(setOrder).catch(() => message.error('Falha ao carregar pedido'));
  }, [id]);

  const payPix = async () => {
    try {
      const resp = await apiPost('/api/payments/pix', { amount: order.totalAmount, description: `Pedido ${id}`, orderId: id });
      window.open(resp.point_of_interaction?.transaction_data?.ticket_url || '#', '_blank');
    } catch { message.error('Falha ao iniciar PIX'); }
  };

  if (!id) return <Result status="404" title="Pedido inválido" />;
  if (!order) return <Card loading />;

  return (
    <Card title="Checkout" extra={<span>Total: R$ {order.totalAmount.toFixed(2)}</span>}>
      <Typography.Text style={{ color: '#FFC300' }}>Pagamento seguro com Mercado Pago – confirmação imediata do seu pedido.</Typography.Text>
      <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Checkbox checked={accepted} onChange={(e) => setAccepted(e.target.checked)}>
          Aceito os termos: pedido não reembolsável em caso de falha de entrega
        </Checkbox>
        <Button type="primary" onClick={payPix} disabled={!accepted} style={{ background: '#E63946' }}>Pagar com PIX</Button>
      </div>
    </Card>
  );
}



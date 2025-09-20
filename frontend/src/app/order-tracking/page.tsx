"use client";
import { useEffect, useState } from 'react';
import { Steps, Card, Typography } from 'antd';
import { useSearchParams } from 'next/navigation';
import { apiGet } from '@/utils/api';

const statuses = ['pending','paid','preparing','out_for_delivery','difficulty','delivered'] as const;

export default function OrderTracking() {
  const params = useSearchParams();
  const id = params.get('id');
  const [status, setStatus] = useState<string>('pending');

  useEffect(() => {
    if (!id) return;
    const load = () => apiGet(`/api/orders/${id}`).then((o:any) => setStatus(o.status));
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [id]);

  const current = Math.max(0, statuses.indexOf(status as any));

  return (
    <Card>
      <Typography.Title level={3} style={{ background: '#FFF3E0' }}>
        Seu pedido está a caminho! Chegando em [tempo estimado] minutos.
      </Typography.Title>
      <Steps
        current={current}
        items={[
          { title: 'Criado' },
          { title: 'Pago' },
          { title: 'Preparando' },
          { title: 'Saiu para entrega' },
          { title: 'Motoboy com dificuldade' },
          { title: 'Entregue' },
        ]}
      />
    </Card>
  );
}



"use client";
import { Button, Card, Typography } from 'antd';
import Image from 'next/image';

export default function Banner({ onCta }: { onCta: () => void }) {
  return (
    <Card style={{ background: '#FFF3E0', borderColor: '#FFF3E0', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Image src="/logo.png" alt="Vai Coxinha" width={64} height={64} />
        <div style={{ flex: 1 }}>
          <Typography.Title level={3} style={{ color: '#E63946', margin: 0 }}>
            Promoção Insana! 3 Coxinhas + Refri por apenas R$9,90 – Peça já e não perca!
          </Typography.Title>
          <Typography.Text style={{ color: '#F3722C' }}>
            Oferta imperdível ativada! Garanta já antes que acabe!
          </Typography.Text>
        </div>
        <Button type="primary" size="large" style={{ background: '#E63946' }} onClick={onCta}>
          Pedir Agora!
        </Button>
      </div>
    </Card>
  );
}


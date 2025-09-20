"use client";
import { useEffect, useState } from 'react';
import { Card, List, Button, Layout, Typography, Badge, message } from 'antd';
import Banner from "@/components/Banner";
import { apiGet, apiPost } from "@/utils/api";

type Product = { _id: string; name: string; description: string; price: number; image: string; isOffer?: boolean; offerPrice?: number };

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiGet<Product[]>('/api/products')
      .then(setProducts)
      .catch(() => message.error('Falha ao carregar cardápio'))
      .finally(() => setLoading(false));
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(() => {}, () => {});
  }, []);

  const addToCart = (p: Product) => setCart((c) => ({ ...c, [p._id]: (c[p._id] || 0) + 1 }));

  const checkout = async () => {
    try {
      const items = products.filter(p => cart[p._id]).map(p => ({ productId: p._id, name: p.name, price: p.offerPrice || p.price, quantity: cart[p._id] }));
      const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const order = await apiPost('/api/orders', { items, totalAmount, payment: { method: 'pix' }, termsAccepted: true, customer: { name: 'Cliente', phone: '000', address: 'Endereço' } });
      message.success('Pedido criado!');
      window.location.href = '/checkout?id=' + order._id;
    } catch { message.error('Falha ao criar pedido'); }
  };

  return (
    <Layout style={{ minHeight: '100vh', padding: 16 }}>
      <Banner onCta={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })} />
      <Typography.Title level={2} id="menu">Cardápio</Typography.Title>
      <List
        loading={loading}
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
        dataSource={products}
        renderItem={(p) => (
          <List.Item>
            <Badge.Ribbon text={p.isOffer ? 'Oferta' : ''} color="#E63946">
              <Card cover={<img src={p.image} alt={p.name} />}>
                <Card.Meta title={p.name} description={p.description} />
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography.Text strong>
                    {p.isOffer && p.offerPrice ? (
                      <>
                        <span style={{ color: '#E63946' }}>R$ {p.offerPrice.toFixed(2)}</span>
                        <span style={{ textDecoration: 'line-through', marginLeft: 8 }}>R$ {p.price.toFixed(2)}</span>
                      </>
                    ) : (
                      <>R$ {p.price.toFixed(2)}</>
                    )}
                  </Typography.Text>
                  <Button type="primary" style={{ background: '#E63946' }} onClick={() => addToCart(p)}>Adicionar</Button>
                </div>
              </Card>
            </Badge.Ribbon>
          </List.Item>
        )}
      />
      <div style={{ position: 'fixed', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Button type="primary" size="large" style={{ background: '#E63946' }} onClick={checkout}>
          Ir para o Checkout ({Object.values(cart).reduce((a, b) => a + b, 0)})
        </Button>
      </div>
    </Layout>
  );
}

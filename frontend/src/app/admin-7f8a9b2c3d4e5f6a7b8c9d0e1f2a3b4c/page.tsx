"use client";
import { useEffect, useState } from 'react';
import { Table, Card, Statistic, Row, Col, Tag, Form, Input, Button, message } from 'antd';
import { apiGet, apiPost, setAuthToken, getAuthToken, apiPatch } from '@/utils/api';

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const token = getAuthToken();

  useEffect(() => {
    if (!token) return;
    const load = () => apiGet<any[]>('/api/orders').then(setOrders).catch(() => {});
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [token]);

  const revenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const topHours = '18-21h';

  if (!token) {
    const onFinish = async (v: any) => {
      try {
        setLoading(true);
        const r = await apiPost<{ token: string }>(`/api/admin/login`, { username: v.username, password: v.password });
        setAuthToken(r.token);
        message.success('Logado com sucesso');
      } catch { message.error('Falha no login'); } finally { setLoading(false); }
    };
    return (
      <Card style={{ maxWidth: 420, margin: '48px auto' }} title="Login Admin">
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="Usuário" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="password" label="Senha" rules={[{ required: true }]}><Input.Password /></Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} style={{ background: '#A0522D' }}>Entrar</Button>
        </Form>
      </Card>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={16}>
        <Col xs={24} md={8}><Card><Statistic title="Receita" value={revenue} precision={2} prefix="R$" /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="Pedidos" value={orders.length} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="Pico" value={topHours} /></Card></Col>
      </Row>
      <Card style={{ marginTop: 16 }} title="Pedidos em tempo real">
        <Table
          rowKey={(r) => r._id}
          dataSource={orders}
          columns={[
            { title: 'ID', dataIndex: '_id', width: 220 },
            { title: 'Total', dataIndex: 'totalAmount', render: (v) => `R$ ${Number(v).toFixed(2)}` },
            { title: 'Status', dataIndex: 'status', render: (s, r) => <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Tag>{s}</Tag><Button size="small" onClick={() => apiPatch(`/api/orders/${r._id}/status`, { status: 'preparing' })}>Preparar</Button><Button size="small" onClick={() => apiPatch(`/api/orders/${r._id}/status`, { status: 'out_for_delivery' })}>Enviar</Button><Button size="small" danger onClick={() => apiPatch(`/api/orders/${r._id}/status`, { status: 'difficulty' })}>Dificuldade</Button><Button size="small" type="primary" onClick={() => apiPatch(`/api/orders/${r._id}/status`, { status: 'delivered' })}>Entregue</Button></div> },
            { title: 'Criado em', dataIndex: 'createdAt' }
          ]}
        />
      </Card>
    </div>
  );
}



"use client";
import { useEffect, useState } from 'react';
import { Table, Card, Statistic, Row, Col, Tag } from 'antd';
import { apiGet } from '@/utils/api';

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const load = () => apiGet<any[]>('/api/orders').then(setOrders).catch(() => {});
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const revenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const topHours = '18-21h';

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
            { title: 'Status', dataIndex: 'status', render: (s) => <Tag>{s}</Tag> },
            { title: 'Criado em', dataIndex: 'createdAt' }
          ]}
        />
      </Card>
    </div>
  );
}



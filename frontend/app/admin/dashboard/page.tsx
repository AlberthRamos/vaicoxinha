'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GlassCard } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ShoppingCart, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Download,
  Filter,
  Search,
  Package,
  Tag,
  BarChart3,
  Settings
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWebSocket } from '@/hooks/use-websocket'
import { useAuth } from '@/hooks/use-auth'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface Order {
  id: string
  customerName: string
  customerPhone: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed'
  paymentMethod: 'cash' | 'card' | 'pix'
  createdAt: string
  estimatedTime: number
  address?: string
  notes?: string
}

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  activeOrders: number
  averageOrderValue: number
  ordersByStatus: Record<string, number>
  ordersByPaymentStatus: Record<string, number>
  recentOrders: Order[]
  topProducts: Array<{
    name: string
    quantity: number
    revenue: number
  }>
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('today')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30)
  
  // WebSocket connection for real-time updates
  const { lastMessage, connectionStatus } = useWebSocket('ws://localhost:3001/admin/orders', {
    enabled: autoRefresh,
    reconnectInterval: 5000,
    reconnectAttempts: 5
  })

  // Check admin authentication
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login')
    }
  }, [user, authLoading, router])

  // Fetch initial data
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data)
      handleWebSocketMessage(data)
    }
  }, [lastMessage])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchDashboardData()
      }, refreshInterval * 1000)
      
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'new_order':
        setOrders(prev => [data.order, ...prev])
        setStats(prev => prev ? {
          ...prev,
          totalOrders: prev.totalOrders + 1,
          activeOrders: prev.activeOrders + 1,
          recentOrders: [data.order, ...prev.recentOrders.slice(0, 9)]
        } : null)
        break
        
      case 'order_status_update':
        setOrders(prev => prev.map(order => 
          order.id === data.orderId 
            ? { ...order, status: data.status, estimatedTime: data.estimatedTime }
            : order
        ))
        break
        
      case 'payment_update':
        setOrders(prev => prev.map(order => 
          order.id === data.orderId 
            ? { ...order, paymentStatus: data.paymentStatus }
            : order
        ))
        break
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ))
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const exportData = (format: 'csv' | 'json') => {
    const data = orders.map(order => ({
      id: order.id,
      customer: order.customerName,
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt
    }))
    
    if (format === 'csv') {
      const csv = [
        ['ID', 'Cliente', 'Total', 'Status', 'Pagamento', 'Método', 'Data'],
        ...data.map(row => Object.values(row))
      ].map(row => row.join(',')).join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    } else {
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `orders-${new Date().toISOString().split('T')[0]}.json`
      a.click()
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status]
  }

  const getPaymentStatusColor = (status: Order['paymentStatus']) => {
    const colors = {
      pending: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    }
    return colors[status]
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coxinha-orange"></div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coxinha-light to-orange-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-coxinha-dark">
          Dashboard Admin - Vai Coxinha
        </h1>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'open' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-sm text-gray-600">
                  {connectionStatus === 'open' ? 'Conectado' : 
                   connectionStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Auto Refresh Toggle */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Auto Atualizar</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={autoRefresh ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                  {autoRefresh ? 'Auto Atualizar: ON' : 'Auto Atualizar: OFF'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchDashboardData}
                  disabled={loading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>
              
              <Button
                size="sm"
                onClick={() => router.push('/admin/orders')}
              >
                📋 Ver Todos Pedidos
              </Button>
              <Button
                size="sm"
                onClick={() => router.push('/admin/products')}
              >
                🛍️ Gerenciar Produtos
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters and Controls */}
        <div className="mb-8">
          <GlassCard className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coxinha-primary"
                >
                  <option value="today">Hoje</option>
                  <option value="week">Esta Semana</option>
                  <option value="month">Este Mês</option>
                  <option value="year">Este Ano</option>
                </select>
              </div>
              
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coxinha-primary"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="preparing">Preparando</option>
                  <option value="ready">Pronto</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                <input
                  type="text"
                  placeholder="Cliente ou ID do pedido"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coxinha-primary"
                />
              </div>
              
              {/* Export */}
              <div className="flex items-end space-x-2">
                <Button
                              onClick={() => exportData('csv')}
                              className="flex-1"
                            >
                              📊 Exportar CSV
                            </Button>
                            <Button
                              onClick={() => exportData('json')}
                              className="flex-1"
                            >
                              📄 Exportar JSON
                            </Button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div>
            <Card className="p-6 text-center hover:scale-105 transition-transform">
              <div className="text-3xl font-bold text-coxinha-primary mb-2">
                {stats?.totalOrders || 0}
              </div>
              <div className="text-gray-600">Total de Pedidos</div>
              <div className="text-sm text-green-600 mt-1">
                <TrendingUp className="inline w-4 h-4 mr-1" />
                +12% vs ontem
              </div>
            </Card>
          </div>

          <div>
            <Card className="p-6 text-center hover:scale-105 transition-transform">
              <div className="text-3xl font-bold text-green-600 mb-2">
                R$ {stats?.totalRevenue || 0}
              </div>
              <div className="text-gray-600">Faturamento Total</div>
              <div className="text-sm text-green-600 mt-1">
                <TrendingUp className="inline w-4 h-4 mr-1" />
                +8% vs ontem
              </div>
            </Card>
          </div>

          <div>
            <Card className="p-6 text-center hover:scale-105 transition-transform">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats?.activeOrders || 0}
              </div>
              <div className="text-gray-600">Pedidos Ativos</div>
              <div className="text-sm text-orange-600 mt-1">
                <Clock className="inline w-4 h-4 mr-1" />
                Em preparação
              </div>
            </Card>
          </div>

          <div>
            <Card className="p-6 text-center hover:scale-105 transition-transform">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                R$ {stats?.averageOrderValue || 0}
              </div>
              <div className="text-gray-600">Ticket Médio</div>
              <div className="text-sm text-purple-600 mt-1">
                <ShoppingCart className="inline w-4 h-4 mr-1" />
                Por pedido
              </div>
            </Card>
          </div>
        </div>

        {/* Orders Table */}
        <div>
          <GlassCard className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-coxinha-dark">
                Pedidos Recentes
              </h2>
              <div className="text-sm text-gray-600">
                {filteredOrders.length} pedido(s) encontrado(s)
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Pedido</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Cliente</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Pagamento</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tempo</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.slice(0, 10).map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-semibold text-gray-900">#{order.id.slice(-6)}</div>
                            <div className="text-sm text-gray-500">
                              {formatDateTime(order.createdAt)}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-semibold text-gray-900">{order.customerName}</div>
                            <div className="text-sm text-gray-500">{order.customerPhone}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(order.total)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.items.length} item(s)
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                            className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${getStatusColor(order.status)}`}
                          >
                            <option value="pending">Pendente</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="preparing">Preparando</option>
                            <option value="ready">Pronto</option>
                            <option value="delivered">Entregue</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                              {order.paymentStatus === 'paid' ? 'Pago' : 
                               order.paymentStatus === 'pending' ? 'Pendente' : 'Falhou'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {order.paymentMethod === 'pix' ? 'PIX' :
                               order.paymentMethod === 'card' ? 'Cartão' : 'Dinheiro'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-900">
                            {order.estimatedTime} min
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => router.push(`/admin/orders/${order.id}`)}
                            >
                              👁️ Ver
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                              disabled={order.status === 'delivered' || order.status === 'cancelled'}
                            >
                              ❌ Cancelar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  
                </tbody>
              </table>
            </div>
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum pedido encontrado com os filtros aplicados.
              </div>
            )}
          </GlassCard>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-coxinha-dark mb-4">
                Ações Rápidas
              </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={() => router.push('/admin/products')}
                className="flex flex-col items-center space-y-2 p-4"
              >
                <Package className="w-8 h-8 text-coxinha-primary" />
                <span>Gerenciar Produtos</span>
              </Button>
              
              <Button
                onClick={() => router.push('/admin/categories')}
                className="flex flex-col items-center space-y-2 p-4"
              >
                <Tag className="w-8 h-8 text-green-600" />
                <span>Categorias</span>
              </Button>
              
              <Button
                onClick={() => router.push('/admin/analytics')}
                className="flex flex-col items-center space-y-2 p-4"
              >
                <BarChart3 className="w-8 h-8 text-purple-600" />
                <span>Análises</span>
              </Button>
              
              <Button
                onClick={() => router.push('/admin/settings')}
                className="flex flex-col items-center space-y-2 p-4"
              >
                <Settings className="w-8 h-8 text-orange-600" />
                <span>Configurações</span>
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
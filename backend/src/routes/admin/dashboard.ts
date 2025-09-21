import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from './auth'

const router = Router()
const prisma = new PrismaClient()

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { period = '7d' } = req.query
    
    // Calculate date range based on period
    const now = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '24h':
        startDate.setDate(now.getDate() - 1)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Get statistics
    const [
      totalOrders,
      totalRevenue,
      pendingOrders,
      deliveredOrders,
      avgDeliveryTime,
      customerSatisfaction,
      recentOrders
    ] = await Promise.all([
      // Total orders
      prisma.order.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      
      // Total revenue
      prisma.order.aggregate({
        where: {
          status: 'delivered',
          createdAt: {
            gte: startDate
          }
        },
        _sum: {
          total: true
        }
      }),
      
      // Pending orders
      prisma.order.count({
        where: {
          status: {
            in: ['pending', 'preparing', 'ready']
          }
        }
      }),
      
      // Delivered orders
      prisma.order.count({
        where: {
          status: 'delivered'
        }
      }),
      
      // Average delivery time
      prisma.order.aggregate({
        where: {
          status: 'delivered',
          deliveredAt: {
            not: null
          },
          createdAt: {
            gte: startDate
          }
        },
        _avg: {
          deliveryTime: true
        }
      }),
      
      // Customer satisfaction (average rating)
      prisma.order.aggregate({
        where: {
          status: 'delivered',
          rating: {
            not: null
          },
          createdAt: {
            gte: startDate
          }
        },
        _avg: {
          rating: true
        }
      }),
      
      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          }
        }
      })
    ])

    res.json({
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      pendingOrders,
      deliveredOrders,
      avgDeliveryTime: avgDeliveryTime._avg.deliveryTime || 0,
      customerSatisfaction: customerSatisfaction._avg.rating || 0,
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.user.name,
        customerEmail: order.user.email,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          id: item.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        }))
      }))
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get orders with filters
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      search, 
      startDate, 
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)
    
    // Build where clause
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string } },
        { user: { name: { contains: search as string } } },
        { user: { email: { contains: search as string } } }
      ]
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string)
      }
    }

    // Get orders
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: Number(limit),
        where,
        orderBy: {
          [sortBy as string]: sortOrder as 'asc' | 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  category: true
                }
              }
            }
          }
        }
      }),
      prisma.order.count({ where })
    ])

    res.json({
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.user.name,
        customerEmail: order.user.email,
        customerPhone: order.user.phone,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        deliveryMethod: order.deliveryMethod,
        deliveryAddress: order.deliveryAddress,
        scheduledTime: order.scheduledTime,
        notes: order.notes,
        rating: order.rating,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        deliveredAt: order.deliveredAt,
        deliveryTime: order.deliveryTime,
        items: order.items.map(item => ({
          id: item.id,
          productName: item.product.name,
          productCategory: item.product.category,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        }))
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Orders list error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Update order status
router.put('/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body

    // Validate status
    const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    // Get current order
    const currentOrder = await prisma.order.findUnique({
      where: { id }
    })

    if (!currentOrder) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // Prepare update data
    const updateData: any = {
      status,
      notes: notes || currentOrder.notes
    }

    // Add timestamps based on status
    if (status === 'delivered' && currentOrder.status !== 'delivered') {
      updateData.deliveredAt = new Date()
      updateData.deliveryTime = Math.floor(
        (new Date().getTime() - new Date(currentOrder.createdAt).getTime()) / (1000 * 60)
      ) // minutes
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        }
      }
    })

    // Send WebSocket notification (if WebSocket server is available)
    try {
      const { getWebSocketServer } = require('../../websocket/server')
      const wss = getWebSocketServer()
      if (wss) {
        const message = {
          type: 'order_status_updated',
          data: {
            orderId: updatedOrder.id,
            orderNumber: updatedOrder.orderNumber,
            status: updatedOrder.status,
            customerEmail: updatedOrder.user.email,
            updatedAt: updatedOrder.updatedAt
          }
        }
        
        // Broadcast to all connected clients
        wss.clients.forEach((client: any) => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify(message))
          }
        })
      }
    } catch (wsError) {
      console.warn('WebSocket notification failed:', wsError)
    }

    res.json({
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        customerName: updatedOrder.user.name,
        customerEmail: updatedOrder.user.email,
        customerPhone: updatedOrder.user.phone,
        total: updatedOrder.total,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        deliveryMethod: updatedOrder.deliveryMethod,
        deliveryAddress: updatedOrder.deliveryAddress,
        scheduledTime: updatedOrder.scheduledTime,
        notes: updatedOrder.notes,
        rating: updatedOrder.rating,
        createdAt: updatedOrder.createdAt,
        updatedAt: updatedOrder.updatedAt,
        deliveredAt: updatedOrder.deliveredAt,
        deliveryTime: updatedOrder.deliveryTime,
        items: updatedOrder.items.map(item => ({
          id: item.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        }))
      }
    })
  } catch (error) {
    console.error('Update order status error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get order by ID
router.get('/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                category: true,
                image: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    res.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.user.name,
        customerEmail: order.user.email,
        customerPhone: order.user.phone,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        deliveryMethod: order.deliveryMethod,
        deliveryAddress: order.deliveryAddress,
        scheduledTime: order.scheduledTime,
        notes: order.notes,
        rating: order.rating,
        ratingComment: order.ratingComment,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        deliveredAt: order.deliveredAt,
        deliveryTime: order.deliveryTime,
        items: order.items.map(item => ({
          id: item.id,
          productName: item.product.name,
          productCategory: item.product.category,
          productImage: item.product.image,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        }))
      }
    })
  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export { router as adminDashboardRouter }
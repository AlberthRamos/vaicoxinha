import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '@app/common/schemas/order.schema';
import { Product, ProductDocument } from '@app/common/schemas/product.schema';
import { Payment, PaymentDocument } from '@app/common/schemas/payment.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  ordersByStatus: {
    pending: number;
    confirmed: number;
    preparing: number;
    delivered: number;
    cancelled: number;
  };
  recentOrders: any[];
  topProducts: any[];
  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalRevenue,
      totalOrders,
      totalProducts,
      totalUsers,
      ordersByStatus,
      recentOrders,
      topProducts,
      monthlyRevenue,
    ] = await Promise.all([
      this.getTotalRevenue(),
      this.orderModel.countDocuments(),
      this.productModel.countDocuments(),
      this.userModel.countDocuments(),
      this.getOrdersByStatus(),
      this.getRecentOrders(),
      this.getTopProducts(),
      this.getMonthlyRevenue(),
    ]);

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalUsers,
      ordersByStatus,
      recentOrders,
      topProducts,
      monthlyRevenue,
    };
  }

  private async getTotalRevenue(): Promise<number> {
    const result = await this.paymentModel.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result.length > 0 ? result[0].total : 0;
  }

  private async getOrdersByStatus(): Promise<{
    pending: number;
    confirmed: number;
    preparing: number;
    delivered: number;
    cancelled: number;
  }> {
    const statusCounts = await this.orderModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusMap = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      delivered: 0,
      cancelled: 0,
    };

    statusCounts.forEach((item) => {
      if (statusMap.hasOwnProperty(item._id)) {
        statusMap[item._id] = item.count;
      }
    });

    return statusMap;
  }

  private async getRecentOrders(): Promise<any[]> {
    return this.orderModel
      .find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .exec();
  }

  private async getTopProducts(): Promise<any[]> {
    const productSales = await this.orderModel.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.productId', totalSold: { $sum: '$items.quantity' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          totalSold: 1,
          price: '$product.price',
        },
      },
    ]);

    return productSales;
  }

  private async getMonthlyRevenue(): Promise<{ month: string; revenue: number }[]> {
    const monthlyRevenue = await this.paymentModel.aggregate([
      { $match: { status: 'PAID' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $substr: [{ $concat: ['0', { $toString: '$_id.month' }] }, -2, 2] },
            ],
          },
          revenue: 1,
          _id: 0,
        },
      },
    ]);

    return monthlyRevenue;
  }
}
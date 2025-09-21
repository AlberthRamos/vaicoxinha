import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ApiGatewayService {
  constructor(
    @Inject('PRODUCTS_SERVICE') private productsClient: ClientProxy,
    @Inject('ORDERS_SERVICE') private ordersClient: ClientProxy,
    @Inject('PAYMENTS_SERVICE') private paymentsClient: ClientProxy,
    @Inject('ADMIN_SERVICE') private adminClient: ClientProxy,
  ) {}

  getHello(): string {
    return 'Vai Coxinha API Gateway - Online!';
  }

  // Products endpoints
  async getProducts() {
    try {
      const response = await lastValueFrom(
        this.productsClient.send({ cmd: 'find_all_products' }, {})
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getProduct(id: string) {
    try {
      const response = await lastValueFrom(
        this.productsClient.send({ cmd: 'find_one_product' }, id)
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Orders endpoints
  async createOrder(createOrderDto: any) {
    try {
      const response = await lastValueFrom(
        this.ordersClient.send({ cmd: 'create_order' }, createOrderDto)
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getOrder(id: string) {
    try {
      const response = await lastValueFrom(
        this.ordersClient.send({ cmd: 'find_one_order' }, id)
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateOrderStatus(id: string, updateStatusDto: any) {
    try {
      const response = await lastValueFrom(
        this.ordersClient.send({ cmd: 'update_order_status' }, { id, ...updateStatusDto })
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Admin endpoints
  async adminLogin(loginDto: any) {
    try {
      const response = await lastValueFrom(
        this.adminClient.send({ cmd: 'admin_login' }, loginDto)
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAdminOrders() {
    try {
      const response = await lastValueFrom(
        this.ordersClient.send({ cmd: 'find_all_orders' }, {})
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAdminStats() {
    try {
      const response = await lastValueFrom(
        this.ordersClient.send({ cmd: 'get_order_stats' }, {})
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { DashboardService, DashboardStats } from './dashboard.service';

@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @MessagePattern({ cmd: 'get_dashboard_stats' })
  async getDashboardStats(): Promise<DashboardStats> {
    return this.dashboardService.getDashboardStats();
  }
}
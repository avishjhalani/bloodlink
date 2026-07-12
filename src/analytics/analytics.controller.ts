import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('analytics')
@UseGuards(JwtGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('blood-types')
  getBloodTypeStats() {
    return this.analyticsService.getBloodTypeStats();
  }

  @Get('activity')
  getRecentActivity() {
    return this.analyticsService.getRecentActivity();
  }
}
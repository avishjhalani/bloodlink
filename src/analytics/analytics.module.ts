import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaServices } from '../../prisma/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'bloodlink_secret_2026',
    }),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, PrismaServices],
})
export class AnalyticsModule {}
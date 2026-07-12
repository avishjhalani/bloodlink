import { Module } from '@nestjs/common';
import { DonorsController } from './donors.controller';
import { DonorsService } from './donors.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaServices } from '../../prisma/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'bloodlink_secret_2026',
    }),
  ],
  controllers: [DonorsController],
  providers: [DonorsService, PrismaServices],
})
export class DonorsModule {}
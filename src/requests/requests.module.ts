import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaServices } from '../../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports:[
    JwtModule.register({
      secret :process.env.JWT_SECRET,
    }),
    NotificationsModule,
  ],
  controllers: [RequestsController],
  providers: [RequestsService,PrismaServices]
})
export class RequestsModule {}

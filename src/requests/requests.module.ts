import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaServices } from '../../prisma/prisma.service';

@Module({
  imports:[
    JwtModule.register({
      secret :process.env.JWT_SECRET,
    }),
  ],
  controllers: [RequestsController],
  providers: [RequestsService,PrismaServices]
})
export class RequestsModule {}

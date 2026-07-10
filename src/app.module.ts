import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaServices } from '../prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { RequestsModule } from './requests/requests.module';

@Module({
  imports: [AuthModule ,RequestsModule],
  controllers: [AppController],
  providers: [AppService,PrismaServices],
})
export class AppModule {}

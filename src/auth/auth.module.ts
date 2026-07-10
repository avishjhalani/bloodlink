import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaServices } from '../../prisma/prisma.service';

@Module({
  imports:[
    JwtModule.register({
      secret : process.env.JWT_SECRET,
      signOptions:{expiresIn :'7d'},
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService,PrismaServices],
  exports :[JwtModule],
})
export class AuthModule {}

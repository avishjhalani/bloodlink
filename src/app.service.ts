import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaServices } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './auth/dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './auth/dto/login.dto';

@Injectable()
export class AppService {
  
}

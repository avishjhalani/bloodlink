import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { PrismaServices } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaServices,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        bloodType: dto.bloodType.toUpperCase(),
        lat: dto.lat,
        lng: dto.lng,
        phone: dto.phone,
      }
    });

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      bloodType: user.bloodType,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        bloodType: user.bloodType,
        isAvailable: user.isAvailable,
      },
      access_token: token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      bloodType: user.bloodType,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        bloodType: user.bloodType,
        isAvailable: user.isAvailable,
      },
      access_token: token,
    };
  }
}
import { Injectable } from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { PrismaServices } from '../../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaServices,
    private notificationsService: NotificationService,
  ) {}

  async create(requesterId: number, dto: CreateRequestDto) {
    // Step 1 — Save the blood request to DB
    const request = await this.prisma.bloodRequest.create({
      data: {
        requesterId,
        bloodType: dto.bloodType.toUpperCase(),
        units: dto.units,
        hospital: dto.hospital,
        address: dto.address,
        lat: dto.lat,
        lng: dto.lng,
        urgency: dto.urgency || 'urgent',
        status: 'active',
      },
    });

    // Step 2 — Find matching donors using PostGIS
    const matchedDonors = await this.findMatchingDonors(
      dto.bloodType.toUpperCase(),
      dto.lat,
      dto.lng,
      10, // radius in km
    );

    if (matchedDonors.length > 0) {
      await this.prisma.donorNotification.createMany({
        data: matchedDonors.map((donor) => ({
          requestId: request.id,
          donorId: donor.id,
          status: 'notified',
          distance: parseFloat(donor.distance_km),
        })),
      });

      // Update donor count on request
      await this.prisma.bloodRequest.update({
        where: { id: request.id },
        data: { donorsNotified: matchedDonors.length },
      });

      // Send emails to all matched donors in parallel
      await this.notificationsService.notifyAllDonors(matchedDonors, request);
    }

    return {
      request: { ...request, donorsNotified: matchedDonors.length },
      matchedDonors: matchedDonors.length,
      donors: matchedDonors,
    };
  }

  async findMatchingDonors(
    bloodType: string,
    lat: number,
    lng: number,
    radiusKm: number,
  ) {
    const donors = await this.prisma.$queryRaw<any[]>`
    SELECT * FROM (
      SELECT 
        u.id,
        u.name,
        u.email,
        u."bloodType",
        u.phone,
        u."reliabilityScore",
        u."isAvailable",
        ROUND(CAST(
          ST_Distance(
            ST_SetSRID(ST_MakePoint(u.lng, u.lat), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
          ) / 1000 AS numeric
        ), 2) AS distance_km
      FROM "User" u
      WHERE 
        u."bloodType" = ${bloodType}
        AND u."isAvailable" = true
        AND (
          u."lastDonationDate" IS NULL OR 
          u."lastDonationDate" < NOW() - INTERVAL '90 days'
        )
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(u.lng, u.lat), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusKm * 1000}
        )
    ) AS matched_donors
    ORDER BY 
      (distance_km * 0.6 + (1 - "reliabilityScore") * 0.4)
    LIMIT 50
  `;

    return donors;
  }

  async findAll(userId: number) {
    return this.prisma.bloodRequest.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive() {
    return this.prisma.bloodRequest.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      include: {
        requester: {
          select: { name: true, phone: true },
        },
      },
    });
  }

  async fulfill(requestId: number, userId: number) {
    return this.prisma.bloodRequest.update({
      where: { id: requestId, requesterId: userId },
      data: { status: 'fulfilled' },
    });
  }
}

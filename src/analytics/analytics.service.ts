import { Injectable } from '@nestjs/common';
import { PrismaServices } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaServices) {}

  async getOverview() {
    const [
      totalRequests,
      activeRequests,
      fulfilledRequests,
      totalDonors,
      availableDonors,
      totalNotifications,
      totalConfirmations,
    ] = await Promise.all([
      this.prisma.bloodRequest.count(),
      this.prisma.bloodRequest.count({ where: { status: 'active' } }),
      this.prisma.bloodRequest.count({ where: { status: 'fulfilled' } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isAvailable: true } }),
      this.prisma.donorNotification.count(),
      this.prisma.donorNotification.count({ where: { status: 'confirmed' } }),
    ]);

    const confirmationRate = totalNotifications > 0
      ? Math.round((totalConfirmations / totalNotifications) * 100)
      : 0;

    const fulfillmentRate = totalRequests > 0
      ? Math.round((fulfilledRequests / totalRequests) * 100)
      : 0;

    return {
      requests: {
        total: totalRequests,
        active: activeRequests,
        fulfilled: fulfilledRequests,
        fulfillmentRate: `${fulfillmentRate}%`,
      },
      donors: {
        total: totalDonors,
        available: availableDonors,
      },
      notifications: {
        total: totalNotifications,
        confirmed: totalConfirmations,
        confirmationRate: `${confirmationRate}%`,
      },
    };
  }

  async getBloodTypeStats() {
    const requests = await this.prisma.bloodRequest.groupBy({
      by: ['bloodType'],
      _count: { bloodType: true },
      orderBy: { _count: { bloodType: 'desc' } },
    });

    const donors = await this.prisma.user.groupBy({
      by: ['bloodType'],
      _count: { bloodType: true },
    });

    return {
      requestsByBloodType: requests.map(r => ({
        bloodType: r.bloodType,
        count: r._count.bloodType,
      })),
      donorsByBloodType: donors.map(d => ({
        bloodType: d.bloodType,
        count: d._count.bloodType,
      })),
    };
  }

  async getRecentActivity() {
    const recentRequests = await this.prisma.bloodRequest.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        requester: { select: { name: true } }
      }
    });

    const recentConfirmations = await this.prisma.donorNotification.findMany({
      take: 5,
      where: { status: 'confirmed' },
      orderBy: { respondedAt: 'desc' },
      include: {
        donor: { select: { name: true, bloodType: true } },
        request: { select: { hospital: true } }
      }
    });

    return {
      recentRequests,
      recentConfirmations,
    };
  }
}
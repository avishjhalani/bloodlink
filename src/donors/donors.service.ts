import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaServices } from '../../prisma/prisma.service';

@Injectable()
export class DonorsService {
  constructor(private prisma: PrismaServices) {}

  async confirmDonation(requestId: number, donorId: number) {
    // Find the notification record
    let notification = await this.prisma.donorNotification.findFirst({
      where: { requestId, donorId }
    });

    if (!notification) {
      // Create a notification record automatically for voluntary donations
      notification = await this.prisma.donorNotification.create({
        data: {
          requestId,
          donorId,
          status: 'confirmed',
          distance: 0,
          respondedAt: new Date(),
        }
      });
    } else {
      // Update existing notification status to confirmed
      await this.prisma.donorNotification.update({
        where: { id: notification.id },
        data: {
          status: 'confirmed',
          respondedAt: new Date(),
        }
      });
    }

    // Update confirmed count on request
    await this.prisma.bloodRequest.update({
      where: { id: requestId },
      data: {
        donorsConfirmed: { increment: 1 }
      }
    });

    return {
      message: 'Thank you for confirming. The requester will contact you shortly.',
      requestId,
      donorId,
    };
  }

  async declineDonation(requestId: number, donorId: number) {
    const notification = await this.prisma.donorNotification.findFirst({
      where: { requestId, donorId }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.donorNotification.update({
      where: { id: notification.id },
      data: {
        status: 'declined',
        respondedAt: new Date(),
      }
    });

    return { message: 'Response recorded. Thank you.' };
  }

  async updateReliabilityScore(donorId: number) {
    // Get all notifications for this donor
    const notifications = await this.prisma.donorNotification.findMany({
      where: { donorId }
    });

    if (notifications.length === 0) return;

    const confirmed = notifications.filter(n => n.status === 'confirmed').length;
    const total = notifications.length;

    // Reliability score = confirmed / total (between 0 and 1)
    const score = confirmed / total;

    await this.prisma.user.update({
      where: { id: donorId },
      data: {
        reliabilityScore: score,
        totalDonations: confirmed,
      }
    });
  }

  async toggleAvailability(donorId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: donorId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: donorId },
      data: { isAvailable: !user.isAvailable }
    });

    return {
      isAvailable: updated.isAvailable,
      message: updated.isAvailable
        ? 'You are now available to donate'
        : 'You are now marked as unavailable'
    };
  }

  async getProfile(donorId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: donorId },
      select: {
        id: true,
        name: true,
        email: true,
        bloodType: true,
        phone: true,
        isAvailable: true,
        reliabilityScore: true,
        totalDonations: true,
        lastDonationDate: true,
        createdAt: true,
      }
    });

    const notifications = await this.prisma.donorNotification.findMany({
      where: { donorId },
      include: {
        request: {
          select: {
            bloodType: true,
            hospital: true,
            status: true,
            createdAt: true,
          }
        }
      },
      orderBy: { notifiedAt: 'desc' },
      take: 10,
    });

    return {
      ...user,
      recentNotifications: notifications,
    };
  }

  async updateLastDonation(donorId: number) {
    return this.prisma.user.update({
      where: { id: donorId },
      data: { lastDonationDate: new Date() }
    });
  }
}
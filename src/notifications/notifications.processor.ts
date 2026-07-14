import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { NotificationService } from './notifications.service';
import { Logger } from '@nestjs/common';

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<{ donor: any; request: any }>) {
    const { donor, request } = job.data;
    this.logger.log(`Processing email job for donor ${donor.name} (Job ID: ${job.id})`);
    try {
      await this.notificationService.notifyDonor(donor, request);
    } catch (err: any) {
      this.logger.error(`Error processing email job ${job.id}: ${err.message}`);
      throw err; // Throwing will trigger Bull's automatic retry
    }
  }
}

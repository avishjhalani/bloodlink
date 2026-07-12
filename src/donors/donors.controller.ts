import { Controller, Post, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { DonorsService } from './donors.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('donors')
@UseGuards(JwtGuard)
export class DonorsController {
  constructor(private donorsService: DonorsService) {}

  @Get('profile')
  getProfile(@Req() req: any) {
    return this.donorsService.getProfile(req['user'].sub);
  }

  @Patch('availability')
  toggleAvailability(@Req() req: any) {
    return this.donorsService.toggleAvailability(req['user'].sub);
  }

  @Patch('donated')
  markDonated(@Req() req: any) {
    return this.donorsService.updateLastDonation(req['user'].sub);
  }

 @Post('confirm/:requestId')
async confirm(@Param('requestId') requestId: string, @Req() req: any) {
  const donorId = req['user'].sub;
  const result = await this.donorsService.confirmDonation(Number(requestId), donorId);
  await this.donorsService.updateReliabilityScore(donorId);
  return result;
}

  @Post('decline/:requestId')
  decline(@Param('requestId') requestId: string, @Req() req: any) {
    return this.donorsService.declineDonation(Number(requestId), req['user'].sub);
  }
}
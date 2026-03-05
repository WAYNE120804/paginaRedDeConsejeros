import { Module } from '@nestjs/common';
import { LeadersController } from './leaders.controller';
import { LeaderService } from './leaders.service';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [LeadersController],
  providers: [LeaderService, RolesGuard],
  exports: [LeaderService],
})
export class LeadersModule {}

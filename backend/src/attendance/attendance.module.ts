import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService, RolesGuard],
})
export class AttendanceModule {}

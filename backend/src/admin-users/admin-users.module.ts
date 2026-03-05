import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [AdminUsersController],
  providers: [AdminUsersService, RolesGuard],
})
export class AdminUsersModule {}

import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { LeaderService } from './leaders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../common/enums/admin-role.enum';
import { CreateLeaderDto } from './dto/create-leader.dto';
import { DeactivateLeaderDto } from './dto/deactivate-leader.dto';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@Controller('leaders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPERADMIN, AdminRole.SECRETARIO)
export class LeadersController {
  constructor(private readonly leaderService: LeaderService) {}

  @Post()
  async create(@Body() dto: CreateLeaderDto, @Req() req: RequestWithUser) {
    const data = await this.leaderService.create(dto, req.user.sub);
    return { data, error: null };
  }

  @Patch(':id/deactivate')
  async deactivate(@Param('id') id: string, @Body() dto: DeactivateLeaderDto, @Req() req: RequestWithUser) {
    const data = await this.leaderService.deactivate(id, dto.endDate, req.user.sub);
    return { data, error: null };
  }

  @Get('active')
  async active() {
    const data = await this.leaderService.getActive();
    return { data, error: null };
  }
}

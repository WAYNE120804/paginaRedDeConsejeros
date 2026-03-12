import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../common/enums/admin-role.enum';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@Controller('admin-users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Post()
  @Roles(AdminRole.SUPERADMIN)
  async create(@Body() dto: CreateAdminUserDto, @Req() req: RequestWithUser) {
    const data = await this.adminUsersService.create(dto, req.user.sub);
    return { data, error: null };
  }

  @Patch(':id/reset-password')
  @Roles(AdminRole.SUPERADMIN)
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
    @Req() req: RequestWithUser,
  ) {
    const data = await this.adminUsersService.resetPassword(id, dto.temporaryPassword, req.user.sub);
    return { data, error: null };
  }

  @Patch(':id/disable')
  @Roles(AdminRole.SUPERADMIN)
  async disable(@Param('id') id: string, @Req() req: RequestWithUser) {
    const data = await this.adminUsersService.disable(id, req.user.sub);
    return { data, error: null };
  }

  @Get()
  @Roles(AdminRole.SUPERADMIN)
  async findAll() {
    const data = await this.adminUsersService.findAll();
    return { data, error: null };
  }
}

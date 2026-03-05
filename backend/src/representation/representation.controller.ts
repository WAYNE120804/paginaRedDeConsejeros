import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { RepresentationService } from './representation.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../common/enums/admin-role.enum';
import { CreateRepresentativeMandateDto } from './dto/create-representative-mandate.dto';
import { CloseRepresentativeMandateDto } from './dto/close-representative-mandate.dto';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@Controller('representation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPERADMIN, AdminRole.SECRETARIO)
export class RepresentationController {
  constructor(private readonly representationService: RepresentationService) {}

  @Post('mandates')
  async createMandate(@Body() dto: CreateRepresentativeMandateDto, @Req() req: RequestWithUser) {
    const data = await this.representationService.createMandate(dto, req.user.sub);
    return { data, error: null };
  }

  @Patch('mandates/:id/close')
  async closeMandate(
    @Param('id') id: string,
    @Body() dto: CloseRepresentativeMandateDto,
    @Req() req: RequestWithUser,
  ) {
    const data = await this.representationService.closeMandate(id, dto.endDate, req.user.sub);
    return { data, error: null };
  }

  @Get('active')
  async active() {
    const data = await this.representationService.getActive();
    return { data, error: null };
  }

  @Get('history/:personId')
  async history(@Param('personId') personId: string) {
    const data = await this.representationService.getHistory(personId);
    return { data, error: null };
  }
}

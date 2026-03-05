import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../common/enums/admin-role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPERADMIN, AdminRole.SECRETARIO)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('representatives.xlsx')
  async reps(@Res() res: Response) {
    const buffer = await this.reportsService.representativesActiveXlsx();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=representatives.xlsx');
    res.send(buffer);
  }

  @Get('representatives-history.xlsx')
  async repsHistory(@Query('personId') personId: string | undefined, @Res() res: Response) {
    const buffer = await this.reportsService.representativesHistoryXlsx(personId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=representatives-history.xlsx');
    res.send(buffer);
  }

  @Get('leaders.xlsx')
  async leaders(@Res() res: Response) {
    const buffer = await this.reportsService.leadersXlsx();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=leaders.xlsx');
    res.send(buffer);
  }

  @Get('board.xlsx')
  async board(@Res() res: Response) {
    const buffer = await this.reportsService.boardXlsx();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=board.xlsx');
    res.send(buffer);
  }
}

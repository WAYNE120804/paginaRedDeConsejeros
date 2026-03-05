import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../common/enums/admin-role.enum';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { CreateAttendanceSessionDto } from './dto/create-attendance-session.dto';
import { ManualAttendanceDto } from './dto/manual-attendance.dto';
import { ScanAttendanceDto } from './dto/scan-attendance.dto';
import { ListAttendanceSessionsQueryDto } from './dto/list-attendance-sessions-query.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('sessions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN, AdminRole.SECRETARIO)
  async createSession(@Body() dto: CreateAttendanceSessionDto, @Req() req: RequestWithUser) {
    const data = await this.attendanceService.createSession(dto, req.user.sub);
    return { data, error: null };
  }


  @Get('sessions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN, AdminRole.SECRETARIO)
  async listSessions(@Query() query: ListAttendanceSessionsQueryDto) {
    const data = await this.attendanceService.listSessions(query);
    return { data, error: null };
  }

  @Get('sessions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN, AdminRole.SECRETARIO)
  async getSession(@Param('id') id: string) {
    const data = await this.attendanceService.getSessionDetails(id);
    return { data, error: null };
  }

  @Get('sessions/:id/records')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN, AdminRole.SECRETARIO)
  async getRecords(@Param('id') id: string) {
    const data = await this.attendanceService.listRecords(id);
    return { data, error: null };
  }

  @Post('sessions/:id/records/manual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN, AdminRole.SECRETARIO)
  async manualRecord(@Param('id') id: string, @Body() dto: ManualAttendanceDto, @Req() req: RequestWithUser) {
    const data = await this.attendanceService.recordManual(id, dto, req.user.sub);
    return { data, error: null };
  }

  @Get('sessions/:id/export.xlsx')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN, AdminRole.SECRETARIO)
  async exportXlsx(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.attendanceService.exportXlsx(id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${id}.xlsx`);
    res.send(buffer);
  }

  @Post('scan/:token')
  async scan(@Param('token') token: string, @Body() dto: ScanAttendanceDto) {
    const data = await this.attendanceService.scanByToken(token, dto);
    return { data, error: null };
  }
}

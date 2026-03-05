import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { BoardService } from './board.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../common/enums/admin-role.enum';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { CreateBoardMandateDto } from './dto/create-board-mandate.dto';
import { CloseBoardMandateDto } from './dto/close-board-mandate.dto';

@Controller('board')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPERADMIN, AdminRole.SECRETARIO)
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post('mandates')
  async create(@Body() dto: CreateBoardMandateDto, @Req() req: RequestWithUser) {
    const data = await this.boardService.create(dto, req.user.sub);
    return { data, error: null };
  }

  @Patch('mandates/:id/close')
  async close(@Param('id') id: string, @Body() dto: CloseBoardMandateDto, @Req() req: RequestWithUser) {
    const data = await this.boardService.close(id, dto.endDate, req.user.sub);
    return { data, error: null };
  }

  @Get('active')
  async active() {
    const data = await this.boardService.getActive();
    return { data, error: null };
  }

  @Get('history/:personId')
  async history(@Param('personId') personId: string) {
    const data = await this.boardService.getHistory(personId);
    return { data, error: null };
  }
}

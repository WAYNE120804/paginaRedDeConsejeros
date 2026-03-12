import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateBoardMandateDto } from './dto/create-board-mandate.dto';

@Injectable()
export class BoardService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBoardMandateDto, actorId: string) {
    const person = await this.prisma.person.findUnique({ where: { id: dto.personId } });
    if (!person) throw new NotFoundException('Persona no encontrada');

    const board = await this.prisma.boardMandate.create({
      data: {
        personId: dto.personId,
        position: dto.position,
        startDate: new Date(dto.startDate),
        isActive: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorAdminId: actorId,
        action: 'CREATE_BOARD_MANDATE',
        entity: 'BOARD_MANDATE',
        entityId: board.id,
        metadata: { personId: dto.personId, position: dto.position },
      },
    });

    return board;
  }

  async close(id: string, endDateRaw: string, actorId: string) {
    const mandate = await this.prisma.boardMandate.findUnique({ where: { id } });
    if (!mandate) throw new NotFoundException('Mandato de consejo no encontrado');
    if (!mandate.isActive) throw new BadRequestException('El mandato ya está cerrado');

    const endDate = new Date(endDateRaw);
    if (Number.isNaN(endDate.getTime())) throw new BadRequestException('end_date inválida');
    if (endDate < mandate.startDate) throw new BadRequestException('end_date debe ser mayor o igual a start_date');

    const updated = await this.prisma.boardMandate.update({
      where: { id },
      data: { endDate, isActive: false },
    });

    await this.prisma.auditLog.create({
      data: {
        actorAdminId: actorId,
        action: 'CLOSE_BOARD_MANDATE',
        entity: 'BOARD_MANDATE',
        entityId: id,
        metadata: { endDate: endDateRaw },
      },
    });

    return updated;
  }

  async getActive() {
    return this.prisma.boardMandate.findMany({
      where: { isActive: true },
      include: { person: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHistory(personId: string) {
    return this.prisma.boardMandate.findMany({
      where: { personId },
      include: { person: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async deleteMandate(id: string, actorId: string) {
    const mandate = await this.prisma.boardMandate.findUnique({ where: { id } });
    if (!mandate) throw new NotFoundException('Mandato de junta no encontrado');
    await this.prisma.boardMandate.delete({ where: { id } });
    await this.prisma.auditLog.create({
      data: { actorAdminId: actorId, action: 'DELETE_BOARD_MANDATE', entity: 'BOARD_MANDATE', entityId: id, metadata: {} },
    });
    return { success: true };
  }
}

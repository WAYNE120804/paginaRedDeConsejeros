import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { MandateStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateLeaderDto } from './dto/create-leader.dto';

@Injectable()
export class LeaderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLeaderDto, actorId: string) {
    const person = await this.prisma.person.findUnique({ where: { id: dto.personId } });
    if (!person) throw new NotFoundException('Persona no encontrada');

    const activeMandate = await this.prisma.representativeMandate.findFirst({
      where: { personId: dto.personId, status: MandateStatus.ACTIVE },
    });
    if (activeMandate) {
      throw new ConflictException('No se puede activar líder: la persona tiene mandato activo');
    }

    const activeLeader = await this.prisma.leader.findFirst({ where: { personId: dto.personId, isActive: true } });
    if (activeLeader) {
      throw new ConflictException('La persona ya tiene un liderazgo activo');
    }

    const leader = await this.prisma.leader.create({
      data: {
        personId: dto.personId,
        faculty: dto.faculty,
        program: dto.program,
        description: dto.description,
        startDate: new Date(dto.startDate),
        isActive: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorAdminId: actorId,
        action: 'CREATE_LEADER',
        entity: 'LEADER',
        entityId: leader.id,
        metadata: { personId: dto.personId },
      },
    });

    return leader;
  }

  async deactivate(id: string, endDateRaw: string, actorId: string) {
    const leader = await this.prisma.leader.findUnique({ where: { id } });
    if (!leader) throw new NotFoundException('Liderazgo no encontrado');
    if (!leader.isActive) throw new BadRequestException('El liderazgo ya está inactivo');

    const endDate = new Date(endDateRaw);
    if (Number.isNaN(endDate.getTime())) throw new BadRequestException('end_date inválida');
    if (endDate < leader.startDate) throw new BadRequestException('end_date debe ser mayor o igual a start_date');

    const updated = await this.prisma.leader.update({
      where: { id },
      data: { isActive: false, endDate },
    });

    await this.prisma.auditLog.create({
      data: {
        actorAdminId: actorId,
        action: 'DEACTIVATE_LEADER',
        entity: 'LEADER',
        entityId: id,
        metadata: { endDate: endDateRaw },
      },
    });

    return updated;
  }

  async getActive() {
    return this.prisma.leader.findMany({
      where: { isActive: true },
      include: { person: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}

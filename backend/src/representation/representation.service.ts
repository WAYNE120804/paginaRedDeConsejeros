import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { MandateStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateRepresentativeMandateDto } from './dto/create-representative-mandate.dto';
import { UpdateRepresentativeMandateDto } from './dto/update-representative-mandate.dto';

@Injectable()
export class RepresentationService {
  constructor(private readonly prisma: PrismaService) {}

  async createMandate(dto: CreateRepresentativeMandateDto, actorId: string) {
    const person = await this.prisma.person.findUnique({ where: { id: dto.personId } });
    if (!person) throw new NotFoundException('Persona no encontrada');

    const activeLeader = await this.prisma.leader.findFirst({ where: { personId: dto.personId, isActive: true } });
    if (activeLeader) {
      throw new ConflictException('No se puede activar mandato: la persona tiene liderazgo activo');
    }

    const activeMandate = await this.prisma.representativeMandate.findFirst({
      where: { personId: dto.personId, status: MandateStatus.ACTIVE },
    });
    if (activeMandate) {
      throw new ConflictException('La persona ya tiene un mandato ACTIVE');
    }

    try {
      const mandate = await this.prisma.representativeMandate.create({
        data: {
          personId: dto.personId,
          estateType: dto.estateType,
          faculty: dto.faculty,
          program: dto.program,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          description: dto.description,
          tshirtSize: dto.tshirtSize,
          status: MandateStatus.ACTIVE,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          actorAdminId: actorId,
          action: 'CREATE_REPRESENTATIVE_MANDATE',
          entity: 'REPRESENTATIVE_MANDATE',
          entityId: mandate.id,
          metadata: { personId: dto.personId },
        },
      });
      return mandate;
    } catch {
      throw new ConflictException('No se pudo crear el mandato activo (conflicto de reglas)');
    }
  }

  async closeMandate(id: string, endDateRaw: string, actorId: string) {
    const mandate = await this.prisma.representativeMandate.findUnique({ where: { id } });
    if (!mandate) throw new NotFoundException('Mandato no encontrado');
    if (mandate.status !== MandateStatus.ACTIVE) throw new BadRequestException('El mandato ya está cerrado');

    const endDate = new Date(endDateRaw);
    if (Number.isNaN(endDate.getTime())) throw new BadRequestException('end_date inválida');
    if (endDate < mandate.startDate) {
      throw new BadRequestException('end_date debe ser mayor o igual a start_date');
    }

    const updated = await this.prisma.representativeMandate.update({
      where: { id },
      data: { endDate, status: MandateStatus.ENDED },
    });

    await this.prisma.auditLog.create({
      data: {
        actorAdminId: actorId,
        action: 'CLOSE_REPRESENTATIVE_MANDATE',
        entity: 'REPRESENTATIVE_MANDATE',
        entityId: updated.id,
        metadata: { endDate: endDateRaw },
      },
    });

    return updated;
  }

  async getActive() {
    return this.prisma.representativeMandate.findMany({
      where: { status: MandateStatus.ACTIVE },
      include: { person: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHistory(personId: string) {
    return this.prisma.representativeMandate.findMany({
      where: { personId },
      include: { person: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async deleteMandate(id: string, actorId: string) {
    const mandate = await this.prisma.representativeMandate.findUnique({ where: { id } });
    if (!mandate) throw new NotFoundException('Mandato no encontrado');
    await this.prisma.representativeMandate.delete({ where: { id } });
    await this.prisma.auditLog.create({
      data: { actorAdminId: actorId, action: 'DELETE_REPRESENTATIVE_MANDATE', entity: 'REPRESENTATIVE_MANDATE', entityId: id, metadata: {} },
    });
    return { success: true };
  }

  async updateMandate(id: string, dto: UpdateRepresentativeMandateDto, actorId: string) {
    const mandate = await this.prisma.representativeMandate.findUnique({ where: { id } });
    if (!mandate) throw new NotFoundException('Mandato no encontrado');

    const updated = await this.prisma.representativeMandate.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorAdminId: actorId,
        action: 'UPDATE_REPRESENTATIVE_MANDATE',
        entity: 'REPRESENTATIVE_MANDATE',
        entityId: id,
        metadata: dto as any,
      },
    });

    return updated;
  }
}

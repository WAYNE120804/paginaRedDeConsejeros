import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

@Injectable()
export class PeopleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePersonDto, actorId: string) {
    try {
      const person = await this.prisma.person.create({ data: dto });
      await this.prisma.auditLog.create({
        data: {
          actorAdminId: actorId,
          action: 'CREATE_PERSON',
          entity: 'PERSON',
          entityId: person.id,
          metadata: { studentCode: person.studentCode, institutionalEmail: person.institutionalEmail },
        },
      });
      return person;
    } catch {
      throw new ConflictException('Código estudiantil o correo institucional ya existe');
    }
  }

  async search(query?: string) {
    if (!query) {
      return this.prisma.person.findMany({ orderBy: { createdAt: 'desc' } });
    }

    return this.prisma.person.findMany({
      where: {
        OR: [
          { studentCode: { contains: query, mode: 'insensitive' } },
          { fullName: { contains: query, mode: 'insensitive' } },
          { institutionalEmail: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const person = await this.prisma.person.findUnique({ where: { id } });
    if (!person) throw new NotFoundException('Persona no encontrada');
    return person;
  }

  async update(id: string, dto: UpdatePersonDto, actorId: string) {
    await this.getById(id);
    try {
      const person = await this.prisma.person.update({ where: { id }, data: dto });
      await this.prisma.auditLog.create({
        data: {
          actorAdminId: actorId,
          action: 'UPDATE_PERSON',
          entity: 'PERSON',
          entityId: person.id,
          metadata: dto,
        },
      });
      return person;
    } catch {
      throw new ConflictException('No fue posible actualizar la persona (datos duplicados)');
    }
  }
}

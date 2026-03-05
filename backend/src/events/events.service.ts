import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Event, EventVisibility, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { StorageService } from '../storage/storage.service';
import { UpdateEventPhotoDto } from './dto/update-event-photo.dto';
import { AdminRole } from '../common/enums/admin-role.enum';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(dto: CreateEventDto, actorId: string) {
    try {
      const event = await this.prisma.event.create({
        data: {
          ...dto,
          slug: this.normalizeSlug(dto.slug),
          date: new Date(dto.date),
        },
      });

      await this.log(actorId, 'CREATE_EVENT', event.id, { slug: event.slug });
      return this.withComputedStatus(event);
    } catch {
      throw new ConflictException('No se pudo crear evento. Verifica que el slug sea único');
    }
  }

  async update(id: string, dto: UpdateEventDto, actorId: string) {
    await this.getByIdOrThrow(id);
    const payload: Prisma.EventUpdateInput = {
      ...dto,
      slug: dto.slug ? this.normalizeSlug(dto.slug) : undefined,
      date: dto.date ? new Date(dto.date) : undefined,
    };

    try {
      const event = await this.prisma.event.update({ where: { id }, data: payload });
      const metadata: Prisma.InputJsonObject = Object.fromEntries(
        Object.entries(dto).filter(([, value]) => value !== undefined),
      );
      await this.log(actorId, 'UPDATE_EVENT', id, metadata);
      return this.withComputedStatus(event);
    } catch {
      throw new ConflictException('No se pudo actualizar evento. Verifica el slug');
    }
  }

  async softDelete(id: string, actorId: string) {
    await this.getByIdOrThrow(id);
    await this.prisma.event.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.log(actorId, 'DELETE_EVENT', id, {});
    return { success: true };
  }

  async list(userRole?: AdminRole) {
    const where: Prisma.EventWhereInput = {
      deletedAt: null,
      ...(userRole ? {} : { visibility: EventVisibility.PUBLIC }),
    };

    const events = await this.prisma.event.findMany({ where, include: { photos: true }, orderBy: { date: 'desc' } });
    return events.map((event) => this.withComputedStatus(event));
  }

  async getBySlug(slug: string, userRole?: AdminRole) {
    const event = await this.prisma.event.findFirst({
      where: { slug, deletedAt: null },
      include: { photos: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');

    if (event.visibility === EventVisibility.HIDDEN && !userRole) {
      throw new NotFoundException('Evento no encontrado');
    }

    return this.withComputedStatus(event);
  }

  async uploadPhoto(eventId: string, file: any | undefined, actorId: string) {
    if (!file) {
      throw new BadRequestException('Archivo inválido. Solo se permiten jpg, png o webp hasta 5MB');
    }

    const event = await this.getByIdOrThrow(eventId);
    const folder = `eventos/${event.slug}`;

    const stored = await this.storage.saveFile({
      folder,
      originalName: file.originalname,
      buffer: file.buffer,
    });

    const photo = await this.prisma.eventPhoto.create({
      data: {
        eventId,
        photoUrl: stored.logicalPath,
      },
    });

    await this.log(actorId, 'UPLOAD_EVENT_PHOTO', eventId, { photoId: photo.id, photoUrl: photo.photoUrl });
    return photo;
  }

  async updatePhoto(eventId: string, photoId: string, dto: UpdateEventPhotoDto, actorId: string) {
    await this.getByIdOrThrow(eventId);
    const photo = await this.prisma.eventPhoto.findFirst({ where: { id: photoId, eventId } });
    if (!photo) throw new NotFoundException('Foto no encontrada');

    const updated = await this.prisma.eventPhoto.update({
      where: { id: photoId },
      data: {
        caption: dto.caption,
        sortOrder: dto.sortOrder,
      },
    });

    await this.log(actorId, 'UPDATE_EVENT_PHOTO', eventId, { photoId, ...dto });
    return updated;
  }

  async deletePhoto(eventId: string, photoId: string, actorId: string) {
    await this.getByIdOrThrow(eventId);
    const photo = await this.prisma.eventPhoto.findFirst({ where: { id: photoId, eventId } });
    if (!photo) throw new NotFoundException('Foto no encontrada');

    await this.storage.deleteFile(photo.photoUrl);
    await this.prisma.eventPhoto.delete({ where: { id: photoId } });
    await this.log(actorId, 'DELETE_EVENT_PHOTO', eventId, { photoId });
    return { success: true };
  }

  private async getByIdOrThrow(id: string) {
    const event = await this.prisma.event.findFirst({ where: { id, deletedAt: null } });
    if (!event) throw new NotFoundException('Evento no encontrado');
    return event;
  }

  private normalizeSlug(raw: string): string {
    const slug = raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    if (!slug) throw new BadRequestException('Slug inválido');
    return slug;
  }

  private withComputedStatus(event: Event & { photos?: unknown[] }) {
    const timezone = process.env.APP_TIMEZONE ?? 'America/Bogota';
    const now = new Date();

    const dateText = event.date.toISOString().slice(0, 10);
    const start = new Date(`${dateText}T${event.startTime}:00`);
    const end = new Date(`${dateText}T${event.endTime}:00`);

    let computedStatus: 'PROXIMO' | 'EN_REALIZACION' | 'FINALIZADO' = 'PROXIMO';
    if (now >= start && now <= end) computedStatus = 'EN_REALIZACION';
    if (now > end) computedStatus = 'FINALIZADO';

    return { ...event, computedStatus, timezone };
  }

  private async log(actorId: string, action: string, entityId: string, metadata: Prisma.InputJsonObject) {
    await this.prisma.auditLog.create({
      data: {
        actorAdminId: actorId,
        action,
        entity: 'EVENT',
        entityId,
        metadata,
      },
    });
  }

  enforceAdminEventRole(role?: AdminRole | null) {
    if (!role) throw new ForbiddenException('No autorizado');
    if (![AdminRole.SUPERADMIN, AdminRole.SECRETARIO, AdminRole.COMUNICACIONES].includes(role)) {
      throw new ForbiddenException('No autorizado');
    }
  }
}

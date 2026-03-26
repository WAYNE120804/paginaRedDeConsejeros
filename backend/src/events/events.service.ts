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
      const slug = await this.resolveUniqueSlug(dto.slug, dto.title);
      const normalizedSlots = this.normalizeTimeSlots(dto.timeSlots, dto.startTime, dto.endTime);
      const event = await this.prisma.event.create({
        data: {
          ...dto,
          slug,
          date: new Date(dto.date),
          startTime: normalizedSlots[0].startTime,
          endTime: normalizedSlots[normalizedSlots.length - 1].endTime,
          timeSlots: normalizedSlots as unknown as Prisma.InputJsonValue,
        },
      });

      await this.log(actorId, 'CREATE_EVENT', event.id, { slug: event.slug });
      return this.withComputedStatus(event);
    } catch {
      throw new ConflictException('No se pudo crear evento. Verifica datos y que el slug sea único');
    }
  }

  async update(id: string, dto: UpdateEventDto, actorId: string) {
    await this.getByIdOrThrow(id);
    const currentEvent = await this.getByIdOrThrow(id);
    const normalizedSlots =
      dto.timeSlots || dto.startTime || dto.endTime
        ? this.normalizeTimeSlots(dto.timeSlots, dto.startTime ?? currentEvent.startTime, dto.endTime ?? currentEvent.endTime)
        : undefined;

    const payload: Prisma.EventUpdateInput = {
      ...dto,
      slug: dto.slug ? this.normalizeSlug(dto.slug) : undefined,
      date: dto.date ? new Date(dto.date) : undefined,
      startTime: normalizedSlots?.[0].startTime,
      endTime: normalizedSlots?.[normalizedSlots.length - 1].endTime,
      timeSlots: normalizedSlots ? (normalizedSlots as unknown as Prisma.InputJsonValue) : undefined,
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

  private buildSlugSeed(title: string, createdAt: Date) {
    const dateText = createdAt.toISOString().slice(0, 10);
    return this.normalizeSlug(`${title}-${dateText}`);
  }

  private async resolveUniqueSlug(rawSlug: string | undefined, title: string) {
    if (rawSlug?.trim()) {
      return this.normalizeSlug(rawSlug);
    }

    const base = this.buildSlugSeed(title, new Date());
    let candidate = base;
    let suffix = 2;

    while (await this.prisma.event.findUnique({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private withComputedStatus(event: Event & { photos?: unknown[]; timeSlots?: Prisma.JsonValue | null }) {
    const now = new Date();
    const dateText = event.date.toISOString().slice(0, 10);
    const slots = this.readTimeSlots(event.timeSlots, event.startTime, event.endTime);

    const isCurrent = slots.some((slot) => {
      const start = new Date(`${dateText}T${slot.startTime}:00`);
      const end = new Date(`${dateText}T${slot.endTime}:00`);
      return now >= start && now <= end;
    });
    const firstStart = new Date(`${dateText}T${slots[0].startTime}:00`);
    const lastEnd = new Date(`${dateText}T${slots[slots.length - 1].endTime}:00`);

    let computedStatus: 'PROXIMO' | 'EN_REALIZACION' | 'FINALIZADO' = 'PROXIMO';
    if (isCurrent) computedStatus = 'EN_REALIZACION';
    else if (now > lastEnd) computedStatus = 'FINALIZADO';
    else if (now < firstStart) computedStatus = 'PROXIMO';

    return { ...event, computedStatus, timeSlots: slots };
  }

  private normalizeTimeSlots(timeSlots: Array<{ startTime: string; endTime: string; label?: string }> | undefined, startTime: string, endTime: string) {
    const baseSlots = timeSlots?.length ? timeSlots : [{ startTime, endTime }];

    const normalized = baseSlots
      .map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        label: slot.label?.trim() || undefined,
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    normalized.forEach((slot) => {
      if (slot.endTime <= slot.startTime) {
        throw new BadRequestException('Cada franja debe tener una hora final posterior a la inicial');
      }
    });

    return normalized;
  }

  private readTimeSlots(timeSlots: Prisma.JsonValue | null | undefined, startTime: string, endTime: string) {
    if (Array.isArray(timeSlots) && timeSlots.length > 0) {
      return timeSlots as Array<{ startTime: string; endTime: string; label?: string }>;
    }

    return [{ startTime, endTime }];
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

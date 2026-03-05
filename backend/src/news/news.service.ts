import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NewsStatus, Prisma } from '@prisma/client';
import { AdminRole } from '../common/enums/admin-role.enum';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(dto: CreateNewsDto, actorId: string) {
    try {
      const created = await this.prisma.news.create({
        data: {
          slug: this.normalizeSlug(dto.slug),
          title: dto.title,
          content: dto.content,
          status: dto.status,
          publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
        },
      });
      await this.log(actorId, 'CREATE_NEWS', created.id, { slug: created.slug });
      return created;
    } catch {
      throw new ConflictException('No se pudo crear la noticia. Verifica slug único.');
    }
  }

  async update(id: string, dto: UpdateNewsDto, actorId: string) {
    await this.ensureNews(id);
    try {
      const updated = await this.prisma.news.update({
        where: { id },
        data: {
          slug: dto.slug ? this.normalizeSlug(dto.slug) : undefined,
          title: dto.title,
          content: dto.content,
          status: dto.status,
          publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
        },
      });
      const metadata: Prisma.InputJsonObject = Object.fromEntries(
        Object.entries(dto).filter(([, value]) => value !== undefined),
      );
      await this.log(actorId, 'UPDATE_NEWS', id, metadata);
      return updated;
    } catch {
      throw new ConflictException('No se pudo actualizar la noticia.');
    }
  }

  async uploadCover(id: string, file: any | undefined, actorId: string) {
    if (!file) throw new BadRequestException('Archivo inválido. Solo jpg, png o webp hasta 5MB.');
    const news = await this.ensureNews(id);
    const stored = await this.storage.saveFile({
      folder: 'noticias',
      originalName: file.originalname,
      buffer: file.buffer,
    });
    const updated = await this.prisma.news.update({ where: { id }, data: { coverPhotoUrl: stored.logicalPath } });
    await this.log(actorId, 'UPLOAD_NEWS_COVER', id, { previous: news.coverPhotoUrl ?? null, current: stored.logicalPath });
    return updated;
  }

  async list(userRole?: AdminRole) {
    return this.prisma.news.findMany({
      where: userRole ? {} : { status: NewsStatus.PUBLISHED },
      orderBy: { createdAt: 'desc' },
    });
  }

  async bySlug(slug: string, userRole?: AdminRole) {
    const news = await this.prisma.news.findUnique({ where: { slug } });
    if (!news) throw new NotFoundException('Noticia no encontrada');
    if (!userRole && news.status !== NewsStatus.PUBLISHED) throw new NotFoundException('Noticia no encontrada');
    return news;
  }

  enforceRole(role?: AdminRole | null) {
    if (!role || ![AdminRole.SUPERADMIN, AdminRole.COMUNICACIONES].includes(role)) {
      throw new ForbiddenException('No autorizado');
    }
  }

  private async ensureNews(id: string) {
    const row = await this.prisma.news.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Noticia no encontrada');
    return row;
  }

  private normalizeSlug(input: string) {
    const slug = input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    if (!slug) throw new BadRequestException('Slug inválido');
    return slug;
  }

  private async log(actorId: string, action: string, entityId: string, metadata: Prisma.InputJsonObject) {
    await this.prisma.auditLog.create({
      data: { actorAdminId: actorId, action, entity: 'NEWS', entityId, metadata },
    });
  }
}

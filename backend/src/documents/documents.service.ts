import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminRole } from '../common/enums/admin-role.enum';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreatePublicDocumentDto } from './dto/create-public-document.dto';
import { PublicDocumentStatus, Prisma } from '@prisma/client';
import { UpdatePublicDocumentDto } from './dto/update-public-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(dto: CreatePublicDocumentDto, file: any | undefined, actorId: string) {
    if (!file) throw new BadRequestException('PDF requerido');
    const stored = await this.storage.saveFile({ folder: 'documentos', originalName: file.originalname, buffer: file.buffer });
    const row = await this.prisma.publicDocument.create({
      data: {
        category: dto.category,
        title: dto.title,
        description: dto.description,
        publishedAt: new Date(dto.publishedAt),
        status: dto.status ?? PublicDocumentStatus.PUBLISHED,
        pdfUrl: stored.logicalPath,
      },
    });
    await this.log(actorId, 'CREATE_PUBLIC_DOCUMENT', row.id, { title: row.title, category: row.category });
    return row;
  }

  async update(id: string, dto: UpdatePublicDocumentDto, actorId: string) {
    await this.ensure(id);
    const row = await this.prisma.publicDocument.update({
      where: { id },
      data: {
        category: dto.category,
        title: dto.title,
        description: dto.description,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
        status: dto.status,
      },
    });
    const metadata: Prisma.InputJsonObject = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined));
    await this.log(actorId, 'UPDATE_PUBLIC_DOCUMENT', id, metadata);
    return row;
  }

  async list(userRole?: AdminRole) {
    return this.prisma.publicDocument.findMany({
      where: userRole ? {} : { status: PublicDocumentStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async getDownload(id: string, userRole?: AdminRole) {
    const row = await this.ensure(id);
    if (!userRole && row.status !== PublicDocumentStatus.PUBLISHED) throw new NotFoundException('Documento no encontrado');
    return row;
  }

  enforceRole(role?: AdminRole | null) {
    if (!role || ![AdminRole.SUPERADMIN, AdminRole.SECRETARIO].includes(role)) {
      throw new ForbiddenException('No autorizado');
    }
  }

  private async ensure(id: string) {
    const row = await this.prisma.publicDocument.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Documento no encontrado');
    return row;
  }

  private async log(actorId: string, action: string, entityId: string, metadata: Prisma.InputJsonObject) {
    await this.prisma.auditLog.create({
      data: { actorAdminId: actorId, action, entity: 'PUBLIC_DOCUMENT', entityId, metadata },
    });
  }
}

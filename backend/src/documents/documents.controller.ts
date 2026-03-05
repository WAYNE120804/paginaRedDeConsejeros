import { Body, Controller, Get, Param, Patch, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { AuthUser, RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { DocumentsService } from './documents.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreatePublicDocumentDto } from './dto/create-public-document.dto';
import { UpdatePublicDocumentDto } from './dto/update-public-document.dto';
import { Request } from 'express';

interface OptionalUserRequest extends Request { user?: AuthUser }

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => cb(null, file.mimetype === 'application/pdf'),
    }),
  )
  async create(@Body() dto: CreatePublicDocumentDto, @UploadedFile() file: any, @Req() req: RequestWithUser) {
    this.documentsService.enforceRole(req.user.role);
    return { data: await this.documentsService.create(dto, file, req.user.sub), error: null };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdatePublicDocumentDto, @Req() req: RequestWithUser) {
    this.documentsService.enforceRole(req.user.role);
    return { data: await this.documentsService.update(id, dto, req.user.sub), error: null };
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async list(@Req() req: OptionalUserRequest) {
    return { data: await this.documentsService.list(req.user?.role), error: null };
  }

  @Get(':id/download')
  @UseGuards(OptionalJwtAuthGuard)
  async download(@Param('id') id: string, @Req() req: OptionalUserRequest, @Res() res: Response) {
    const doc = await this.documentsService.getDownload(id, req.user?.role);
    res.redirect(doc.pdfUrl);
  }
}

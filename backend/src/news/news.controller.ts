import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { AuthUser, RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsService } from './news.service';

const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
interface OptionalUserRequest extends Request { user?: AuthUser }

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateNewsDto, @Req() req: RequestWithUser) {
    this.newsService.enforceRole(req.user.role);
    return { data: await this.newsService.create(dto, req.user.sub), error: null };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateNewsDto, @Req() req: RequestWithUser) {
    this.newsService.enforceRole(req.user.role);
    return { data: await this.newsService.update(id, dto, req.user.sub), error: null };
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async list(@Req() req: OptionalUserRequest) {
    return { data: await this.newsService.list(req.user?.role), error: null };
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  async bySlug(@Param('slug') slug: string, @Req() req: OptionalUserRequest) {
    return { data: await this.newsService.bySlug(slug, req.user?.role), error: null };
  }

  @Post(':id/cover')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => cb(null, imageMimeTypes.includes(file.mimetype)),
    }),
  )
  async uploadCover(@Param('id') id: string, @UploadedFile() file: any, @Req() req: RequestWithUser) {
    this.newsService.enforceRole(req.user.role);
    return { data: await this.newsService.uploadCover(id, file, req.user.sub), error: null };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    this.newsService.enforceRole(req.user.role);
    await this.newsService.delete(id, req.user.sub);
    return { data: { success: true }, error: null };
  }
}

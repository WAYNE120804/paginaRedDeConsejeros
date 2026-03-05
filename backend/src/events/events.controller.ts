import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { RequestWithUser, AuthUser } from '../common/interfaces/request-with-user.interface';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateEventPhotoDto } from './dto/update-event-photo.dto';

const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
interface OptionalUserRequest extends Request {
  user?: AuthUser;
}

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateEventDto, @Req() req: RequestWithUser) {
    this.eventsService.enforceAdminEventRole(req.user.role);
    const data = await this.eventsService.create(dto, req.user.sub);
    return { data, error: null };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateEventDto, @Req() req: RequestWithUser) {
    this.eventsService.enforceAdminEventRole(req.user.role);
    const data = await this.eventsService.update(id, dto, req.user.sub);
    return { data, error: null };
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async list(@Req() req: OptionalUserRequest) {
    const data = await this.eventsService.list(req.user?.role);
    return { data, error: null };
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  async bySlug(@Param('slug') slug: string, @Req() req: OptionalUserRequest) {
    const data = await this.eventsService.getBySlug(slug, req.user?.role);
    return { data, error: null };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    this.eventsService.enforceAdminEventRole(req.user.role);
    const data = await this.eventsService.softDelete(id, req.user.sub);
    return { data, error: null };
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        cb(null, imageMimeTypes.includes(file.mimetype));
      },
    }),
  )
  async uploadPhoto(@Param('id') id: string, @UploadedFile() file: any, @Req() req: RequestWithUser) {
    this.eventsService.enforceAdminEventRole(req.user.role);
    const data = await this.eventsService.uploadPhoto(id, file, req.user.sub);
    return { data, error: null };
  }

  @Patch(':id/photos/:photoId')
  @UseGuards(JwtAuthGuard)
  async updatePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @Body() dto: UpdateEventPhotoDto,
    @Req() req: RequestWithUser,
  ) {
    this.eventsService.enforceAdminEventRole(req.user.role);
    const data = await this.eventsService.updatePhoto(id, photoId, dto, req.user.sub);
    return { data, error: null };
  }

  @Delete(':id/photos/:photoId')
  @UseGuards(JwtAuthGuard)
  async deletePhoto(@Param('id') id: string, @Param('photoId') photoId: string, @Req() req: RequestWithUser) {
    this.eventsService.enforceAdminEventRole(req.user.role);
    const data = await this.eventsService.deletePhoto(id, photoId, req.user.sub);
    return { data, error: null };
  }
}

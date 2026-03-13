import { Body, Controller, Get, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { StorageService } from './storage.service';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Get('browse')
  async browse(@Query('path') path: string = '') {
    const data = await this.storage.browse(path);
    return { data, error: null };
  }

  @Post('folder')
  async createFolder(@Body() body: { parent: string; name: string }) {
    await this.storage.createFolder(body.parent || '', body.name);
    return { data: { success: true }, error: null };
  }

  @Patch('rename')
  async rename(@Body() body: { oldPath: string; newName: string }) {
    await this.storage.rename(body.oldPath, body.newName);
    return { data: { success: true }, error: null };
  }

  @Patch('move')
  async move(@Body() body: { oldPath: string; newFolder: string }) {
    await this.storage.move(body.oldPath, body.newFolder);
    return { data: { success: true }, error: null };
  }

  @Post('delete') // Using POST for delete if DELETE method issues are suspected, or standard DELETE
  async delete(@Body() body: { path: string }) {
    await this.storage.deleteFile(body.path);
    return { data: { success: true }, error: null };
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB wiki limit
    }),
  )
  async upload(
    @Query('folder') folder: string = '',
    @UploadedFile() file: any,
  ) {
    const data = await this.storage.saveFile({
      folder,
      originalName: file.originalname,
      buffer: file.buffer,
    });
    return { data, error: null };
  }
}

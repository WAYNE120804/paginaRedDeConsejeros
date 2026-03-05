import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, extname, basename } from 'path';
import { randomBytes } from 'crypto';
import { StorageService, StoredFileResult } from './storage.service';

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly uploadsRoot = join(process.cwd(), 'uploads');

  async saveFile(params: {
    folder: string;
    originalName: string;
    buffer: Buffer;
  }): Promise<StoredFileResult> {
    const safeFolder = this.sanitizeSegment(params.folder);
    const targetDir = join(this.uploadsRoot, safeFolder);
    await fs.mkdir(targetDir, { recursive: true });

    const extension = extname(params.originalName).toLowerCase();
    const originalBase = basename(params.originalName, extension)
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50) || 'file';

    const filename = `${Date.now()}-${randomBytes(4).toString('hex')}-${originalBase}${extension}`;
    const diskPath = join(targetDir, filename);
    await fs.writeFile(diskPath, params.buffer);

    return { logicalPath: `/uploads/${safeFolder}/${filename}` };
  }

  async deleteFile(logicalPath: string): Promise<void> {
    if (!logicalPath.startsWith('/uploads/')) return;
    const relativePath = logicalPath.replace('/uploads/', '');
    const diskPath = join(this.uploadsRoot, relativePath);
    await fs.rm(diskPath, { force: true });
  }

  private sanitizeSegment(segment: string): string {
    return segment
      .split('/')
      .map((part) =>
        part
          .toLowerCase()
          .replace(/[^a-z0-9-_]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, ''),
      )
      .filter(Boolean)
      .join('/');
  }
}

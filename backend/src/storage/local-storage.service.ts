import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, extname, basename } from 'path';
import * as path from 'path';
import { randomBytes } from 'crypto';
import { StorageService, StoredFileResult, BrowseItem } from './storage.service';

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
    const isUploadsPath = logicalPath.startsWith('/uploads/');
    const relativePath = isUploadsPath ? logicalPath.replace('/uploads/', '') : logicalPath;
    const diskPath = join(this.uploadsRoot, relativePath);
    await fs.rm(diskPath, { force: true, recursive: true });
  }

  async move(oldPath: string, newFolder: string): Promise<void> {
    const isOldUploads = oldPath.startsWith('/uploads/');
    const relativeOldPath = isOldUploads ? oldPath.replace('/uploads/', '') : oldPath;
    
    // Si newFolder es 'root' o vacío, es la raíz de uploads
    const cleanNewFolder = newFolder === 'root' ? '' : this.sanitizeSegment(newFolder);
    
    const fullOldPath = join(this.uploadsRoot, relativeOldPath);
    const filename = basename(fullOldPath);
    const fullNewPath = join(this.uploadsRoot, cleanNewFolder, filename);

    // Asegurar que el destino existe
    await fs.mkdir(join(this.uploadsRoot, cleanNewFolder), { recursive: true });
    await fs.rename(fullOldPath, fullNewPath);
  }

  async browse(path: string): Promise<BrowseItem[]> {
    const safePath = this.sanitizeSegment(path);
    const targetDir = join(this.uploadsRoot, safePath);
    
    try {
      await fs.mkdir(this.uploadsRoot, { recursive: true });
      const entries = await fs.readdir(targetDir, { withFileTypes: true });
      
      const items: BrowseItem[] = await Promise.all(
        entries.map(async (entry) => {
          const entryPath = join(targetDir, entry.name);
          const stats = await fs.stat(entryPath);
          const logicalPath = `/uploads/${safePath ? safePath + '/' : ''}${entry.name}`;
          
          return {
            id: entry.name + stats.mtimeMs,
            name: entry.name,
            type: entry.isDirectory() ? 'folder' : 'file',
            logicalPath: entry.isDirectory() ? path + (path ? '/' : '') + entry.name : logicalPath,
            size: stats.size,
            updatedAt: stats.mtime,
          };
        })
      );
      
      return items.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    } catch {
      return [];
    }
  }

  async createFolder(parent: string, name: string): Promise<void> {
    const safeParent = this.sanitizeSegment(parent);
    const safeName = this.sanitizeSegment(name);
    const targetDir = join(this.uploadsRoot, safeParent, safeName);
    await fs.mkdir(targetDir, { recursive: true });
  }

  async rename(oldPath: string, newName: string): Promise<void> {
    const isUploadsPath = oldPath.startsWith('/uploads/');
    const relativeOldPath = isUploadsPath ? oldPath.replace('/uploads/', '') : oldPath;
    
    // Si es una ruta lógica de carpeta (browser), no empieza por /uploads/
    // Pero si es un archivo, sí.
    
    const fullOldPath = join(this.uploadsRoot, relativeOldPath);
    const parentDir = path.dirname(fullOldPath);
    
    // Sanitize new name
    const safeNewName = this.sanitizeSegment(newName);
    // Keep extension if it's a file
    const extension = extname(fullOldPath);
    const finalNewName = extension && !newName.endsWith(extension) ? safeNewName + extension : safeNewName;

    const fullNewPath = join(parentDir, finalNewName);
    await fs.rename(fullOldPath, fullNewPath);
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

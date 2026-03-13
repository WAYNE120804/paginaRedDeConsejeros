export interface StoredFileResult {
  logicalPath: string;
}

export interface BrowseItem {
  id: string; // for React keys
  name: string;
  type: 'file' | 'folder';
  logicalPath: string;
  size?: number;
  updatedAt?: Date;
}

export abstract class StorageService {
  abstract saveFile(params: {
    folder: string;
    originalName: string;
    buffer: Buffer;
  }): Promise<StoredFileResult>;

  abstract deleteFile(logicalPath: string): Promise<void>;

  abstract browse(path: string): Promise<BrowseItem[]>;

  abstract createFolder(parent: string, name: string): Promise<void>;

  abstract rename(oldPath: string, newName: string): Promise<void>;

  abstract move(oldPath: string, newFolder: string): Promise<void>;
}

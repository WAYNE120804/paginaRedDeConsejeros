export interface StoredFileResult {
  logicalPath: string;
}

export abstract class StorageService {
  abstract saveFile(params: {
    folder: string;
    originalName: string;
    buffer: Buffer;
  }): Promise<StoredFileResult>;

  abstract deleteFile(logicalPath: string): Promise<void>;
}

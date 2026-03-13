import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LocalStorageService } from './local-storage.service';
import { StorageController } from './storage.controller';

@Global()
@Module({
  providers: [
    {
      provide: StorageService,
      useClass: LocalStorageService,
    },
  ],
  controllers: [StorageController],
  exports: [StorageService],
})
export class StorageModule {}

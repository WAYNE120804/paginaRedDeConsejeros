import { Module } from '@nestjs/common';
import { RepresentationController } from './representation.controller';
import { RepresentationService } from './representation.service';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [RepresentationController],
  providers: [RepresentationService, RolesGuard],
  exports: [RepresentationService],
})
export class RepresentationModule {}

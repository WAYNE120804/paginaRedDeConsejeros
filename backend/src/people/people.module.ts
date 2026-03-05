import { Module } from '@nestjs/common';
import { PeopleService } from './people.service';
import { PeopleController } from './people.controller';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  providers: [PeopleService, RolesGuard],
  controllers: [PeopleController],
  exports: [PeopleService],
})
export class PeopleModule {}

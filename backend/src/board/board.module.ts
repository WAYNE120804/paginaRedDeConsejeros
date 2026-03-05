import { Module } from '@nestjs/common';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [BoardController],
  providers: [BoardService, RolesGuard],
  exports: [BoardService],
})
export class BoardModule {}
